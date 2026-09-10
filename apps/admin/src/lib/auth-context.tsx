"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminUser } from "./types";
import { adminLogin, adminLogout, adminRefresh, getAdminMe, setAuthEventHandlers } from "./api";

type AuthContextValue = {
  user: AdminUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Same pattern as apps/web: access token lives only in memory, never
// localStorage - persistence across reloads comes from silently
// exchanging the httpOnly admin refresh cookie on mount.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lets api.ts's authFetch silently refresh an expired access token
    // mid-request (any authenticated call, not just the ones this
    // provider makes directly) and push the new token back in here,
    // instead of every call site having to notice a 401 itself.
    setAuthEventHandlers({
      onTokenRefreshed: (token) => setAccessToken(token),
      onSessionExpired: () => {
        setAccessToken(null);
        setUser(null);
      },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminRefresh()
      .then(async ({ accessToken: token }) => {
        const me = await getAdminMe(token);
        if (cancelled) return;
        setAccessToken(token);
        setUser(me);
      })
      .catch(() => {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminLogin(email, password);
    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await adminLogout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
