"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { useAuth } from "../lib/auth-context";
import { useCart } from "../lib/cart-context";
import { addWishlistItem } from "../lib/api";

export function ProductBuyBox({
  productId,
  price,
  mrp,
  inStock,
}: {
  productId: string;
  price: number;
  mrp: number;
  inStock: boolean;
}) {
  const { user, accessToken } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const discountPercent = mrp > price ? Math.round((1 - price / mrp) * 100) : 0;

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

  async function handleBuyNow() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await addItem(productId, quantity);
      router.push("/cart");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not add to cart");
      setBusy(false);
    }
  }

  async function handleWishlist() {
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
    <div className="rounded-[10px] border border-brand-line p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-extrabold text-brand-ink">{formatIndianRupees(price)}</span>
        {discountPercent > 0 ? (
          <span className="text-[13px] font-medium text-brand-sub line-through">{formatIndianRupees(mrp)}</span>
        ) : null}
      </div>
      {discountPercent > 0 ? <div className="mb-3 text-xs font-bold text-brand-red">{discountPercent}% OFF</div> : null}

      <div className="mb-3 flex items-center justify-between text-[12.5px]">
        <span>Quantity</span>
        <span className="flex items-center gap-3 rounded-[6px] border border-brand-line px-3.5 py-1.5">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="font-bold text-brand-sub">
            −
          </button>
          {quantity}
          <button type="button" onClick={() => setQuantity((q) => q + 1)} className="font-bold text-brand-sub">
            +
          </button>
        </span>
      </div>

      <Button onClick={handleAddToCart} disabled={busy || !inStock} className="mb-2 w-full">
        {inStock ? "Add to Cart 🛒" : "Out of stock"}
      </Button>
      <Button variant="secondary" onClick={handleBuyNow} disabled={busy || !inStock} className="mb-2 w-full">
        ⚡ Buy Now
      </Button>
      <button
        type="button"
        onClick={handleWishlist}
        disabled={busy}
        className="w-full rounded-[7px] border border-brand-line bg-white py-2.5 text-[13px] font-semibold text-brand-ink transition hover:border-brand-green"
      >
        ♡ Add to Wishlist
      </button>

      {status ? <p className="mt-3 text-[12.5px] font-medium text-brand-green-dark">{status}</p> : null}
    </div>
  );
}
