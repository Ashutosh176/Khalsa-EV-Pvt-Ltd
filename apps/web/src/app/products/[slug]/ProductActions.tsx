"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import { useAuth } from "../../../lib/auth-context";
import { useCart } from "../../../lib/cart-context";
import { addWishlistItem } from "../../../lib/api";

export function ProductActions({ productId, inStock }: { productId: string; inStock: boolean }) {
  const { user, accessToken } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAddToCart() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await addItem(productId, quantity);
      setStatus("Added to cart");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddToWishlist() {
    if (!user || !accessToken) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await addWishlistItem(accessToken, productId);
      setStatus("Added to wishlist");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not add to wishlist");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-brand-green"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:border-brand-green"
          >
            +
          </button>
        </div>

        <Button onClick={handleAddToCart} disabled={busy || !inStock} className="flex-1">
          {inStock ? "Add to cart" : "Out of stock"}
        </Button>
        <Button variant="secondary" onClick={handleAddToWishlist} disabled={busy}>
          Wishlist
        </Button>
      </div>

      {status ? <p className="mt-3 text-sm font-medium text-brand-green">{status}</p> : null}
    </div>
  );
}
