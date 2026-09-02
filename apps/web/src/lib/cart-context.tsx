"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CartView } from "@khalsa-ev/types";
import { addCartItem, getCart, removeCartItem, updateCartItem } from "./api";
import { useAuth } from "./auth-context";

type CartContextValue = {
  cart: CartView | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateItem: (itemId: string, dto: { quantity?: number; savedForLater?: boolean }) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [cartState, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(false);

  // Logged-out is derived (not cleared via setState) so the effect
  // never needs a synchronous setState branch - it simply does nothing
  // when there's no token to fetch with.
  const cart = accessToken ? cartState : null;

  // Fetch logic lives inline in the effect (not delegated to a named
  // callback) so a mount/auth-change fetch and an ignore-stale-response
  // guard live in one place; `refresh` below is a separate function for
  // callers that want to manually re-fetch (e.g. after a wishlist move).
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    // "mark loading before an async fetch" - standard pattern, no better
    // construct exists yet for this in the current react-hooks ruleset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getCart(accessToken)
      .then((result) => {
        if (!cancelled) setCart(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      setCart(await getCart(accessToken));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const addItem = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      if (!accessToken) throw new Error("Sign in to add items to your cart");
      setCart(await addCartItem(accessToken, { productId, variantId, quantity }));
    },
    [accessToken],
  );

  const updateItem = useCallback(
    async (itemId: string, dto: { quantity?: number; savedForLater?: boolean }) => {
      if (!accessToken) return;
      setCart(await updateCartItem(accessToken, itemId, dto));
    },
    [accessToken],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!accessToken) return;
      setCart(await removeCartItem(accessToken, itemId));
    },
    [accessToken],
  );

  return (
    <CartContext.Provider value={{ cart, loading, refresh, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
