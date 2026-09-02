"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import type { WishlistItemView } from "@khalsa-ev/types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../lib/auth-context";
import { useCart } from "../../lib/cart-context";
import { getWishlist, moveWishlistItemToCart, removeWishlistItem } from "../../lib/api";

export default function WishlistPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [itemsState, setItems] = useState<WishlistItemView[] | null>(null);
  // Derived, not cleared via setState, so the effect below never needs
  // a synchronous setState branch for the logged-out case.
  const items = accessToken ? itemsState : null;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getWishlist(accessToken)
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleRemove(itemId: string) {
    if (!accessToken) return;
    setItems(await removeWishlistItem(accessToken, itemId));
  }

  async function handleMoveToCart(itemId: string) {
    if (!accessToken) return;
    const result = await moveWishlistItemToCart(accessToken, itemId);
    setItems(result.wishlist);
    void refreshCart();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">Your wishlist</h1>

        {!authLoading && !user ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">Log in to view and manage your wishlist.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green">
              Log in
            </Link>
          </div>
        ) : items === null ? (
          <p className="mt-8 text-sm text-slate-500">Loading your wishlist...</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">Your wishlist is empty.</p>
            <Link href="/products" className="mt-4 inline-block font-semibold text-brand-green">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                <Link href={`/products/${item.product.slug}`} className="font-bold text-brand-ink hover:text-brand-green">
                  {item.product.name}
                </Link>
                <p className="mt-1 text-xs text-slate-400">SKU: {item.product.sku}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-lg font-black text-brand-ink">{formatIndianRupees(item.product.price)}</span>
                  {item.product.mrp > item.product.price ? (
                    <span className="text-sm text-slate-400 line-through">{formatIndianRupees(item.product.mrp)}</span>
                  ) : null}
                </div>
                <p className={`mt-1 text-xs font-semibold ${item.product.inStock ? "text-brand-green" : "text-red-500"}`}>
                  {item.product.inStock ? "In stock" : "Out of stock"}
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item.id)}
                    disabled={!item.product.inStock}
                    className="flex-1 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f8c13] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Move to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-300 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
