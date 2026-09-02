"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";
import { CartProvider } from "../lib/cart-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
