"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CustomerUser } from "@khalsa-ev/types";
import { getCurrentCustomer, loginCustomer, logoutCustomer, refreshCustomerSession, registerCustomer } from "./api";

type RegisterInput = { email: string; password: string; name: string; phone?: string };

type AuthContextValue = {
  user: CustomerUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
