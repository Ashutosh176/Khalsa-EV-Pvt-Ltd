"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import { addWishlistItem } from "../lib/api";

export function ProductCardActions({ productId, inStock }: { productId: string; inStock: boolean }) {
  const { accessToken } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setError(null);
    setAdding(true);
    try {
      await addItem(productId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to cart");
    } finally {
      setAdding(false);
    }
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!accessToken) {
      router.push("/login");
      return;
    }
    try {
      await addWishlistItem(accessToken, productId);
      setWishlisted(true);
    } catch {
      // Silently ignore - most likely already in the wishlist.
    }
  }

  return (
    <div>
      {error ? <p className="mb-1.5 text-[11px] text-brand-red">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[7px] bg-[var(--accent,var(--color-brand-green))] py-2 text-[13px] font-semibold text-white transition hover:bg-[var(--accent-dark,var(--color-brand-green-dark))] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? "Added ✓" : adding ? "Adding..." : inStock ? "Add to Cart 🛒" : "Out of stock"}
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          className="flex w-9 shrink-0 items-center justify-center rounded-[7px] border border-brand-line bg-white text-base transition hover:border-[var(--accent,var(--color-brand-green))]"
        >
          {wishlisted ? "❤" : "♡"}
        </button>
      </div>
    </div>
  );
}
