"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CustomerUser } from "@khalsa-ev/types";
import {
  getCurrentCustomer,
  loginCustomer,
  loginCustomerWithOtp,
  logoutCustomer,
  refreshCustomerSession,
  registerCustomer,
  setAuthEventHandlers,
} from "./api";

type RegisterInput = { email: string; password: string; name: string; phone: string; phoneVerificationId: string };

type AuthContextValue = {
  user: CustomerUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (phone: string, verificationId: string) => Promise<void>;
  register: (dto: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: CustomerUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Access token lives only in memory, never localStorage - persistence
// across reloads comes from silently exchanging the httpOnly refresh
// cookie on mount, not from anything readable by JS/XSS.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
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
    refreshCustomerSession()
      .then(async ({ accessToken: token }) => {
        setAccessToken(token);
        setUser(await getCurrentCustomer(token));
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginCustomer({ email, password });
    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const loginWithOtp = useCallback(async (phone: string, verificationId: string) => {
    const result = await loginCustomerWithOtp({ phone, verificationId });
    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (dto: RegisterInput) => {
    const result = await registerCustomer(dto);
    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutCustomer().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, loginWithOtp, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
