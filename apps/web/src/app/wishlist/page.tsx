"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import type { WishlistItemView } from "@khalsa-ev/types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AccountNav } from "../../components/AccountNav";
import { useAuth } from "../../lib/auth-context";
import { useCart } from "../../lib/cart-context";
import { getWishlist, moveWishlistItemToCart, removeWishlistItem } from "../../lib/api";

const TIPS = [
  ["♡", "Save Your Favorites", "Items in your wishlist are safe and easy to access anytime."],
  ["🛡️", "Easy & Secure", "Add items to cart and enjoy secure checkout."],
];

export default function WishlistPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [itemsState, setItems] = useState<WishlistItemView[] | null>(null);
  const items = accessToken ? itemsState : null;
  const [movingAll, setMovingAll] = useState(false);

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

  async function handleMoveAllToCart() {
    if (!accessToken || !items) return;
    setMovingAll(true);
    try {
      for (const item of items.filter((i) => i.product.inStock)) {
        await moveWishlistItemToCart(accessToken, item.id);
      }
      setItems(await getWishlist(accessToken));
      void refreshCart();
    } finally {
      setMovingAll(false);
    }
  }

  return (
    <main className="theme-scooters min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {!authLoading && !user ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to view and manage your wishlist.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-blue-dark">
              Log in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <AccountNav />

            <div className="flex-1">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-[23px] font-bold">My Wishlist {items ? `(${items.length})` : ""}</h1>
                  <p className="text-[13px] text-brand-sub">Save items you love and buy them later.</p>
                </div>
                {items && items.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleMoveAllToCart}
                    disabled={movingAll}
                    className="rounded-[7px] bg-brand-blue px-[18px] py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-50"
                  >
                    {movingAll ? "Moving..." : "🛒 Move All to Cart"}
                  </button>
                ) : null}
              </div>

              {items === null ? (
                <p className="text-sm text-brand-sub">Loading your wishlist...</p>
              ) : items.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
                  <p className="text-brand-sub">Your wishlist is empty.</p>
                  <Link href="/products" className="mt-4 inline-block font-semibold text-brand-blue-dark">
                    Browse products
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const discountPercent =
                      item.product.mrp > item.product.price
                        ? Math.round((1 - item.product.price / item.product.mrp) * 100)
                        : 0;
                    return (
                      <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-[10px] border border-brand-line p-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-brand-line bg-gradient-to-br from-[#F2F4F1] to-[#E4E9E3]">
                          {item.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- product images are remote
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full rounded-lg object-cover" />
                          ) : (
                            <span className="text-3xl">🔧</span>
                          )}
                        </div>
                        <div className="min-w-[200px] flex-1">
                          <Link href={`/products/${item.product.slug}`} className="text-[13.5px] font-bold hover:text-brand-blue-dark">
                            {item.product.name}
                          </Link>
                          <div className="my-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                item.product.inStock ? "bg-brand-blue-light text-brand-blue-dark" : "bg-red-50 text-brand-red"
                              }`}
                            >
                              {item.product.inStock ? "In Stock" : "Out of stock"}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[15px] font-extrabold">{formatIndianRupees(item.product.price)}</span>
                            {discountPercent > 0 ? (
                              <>
                                <span className="text-[11.5px] text-brand-sub line-through">{formatIndianRupees(item.product.mrp)}</span>
                                <span className="text-[11px] font-bold text-brand-red">{discountPercent}% OFF</span>
                              </>
                            ) : null}
                          </div>
                          <div className="mt-1.5 flex gap-3.5 text-[11.5px]">
                            <button type="button" onClick={() => handleRemove(item.id)} className="text-brand-red">
                              🗑 Remove
                            </button>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleMoveToCart(item.id)}
                            disabled={!item.product.inStock}
                            className="rounded-[7px] border border-brand-blue px-[18px] py-2 text-[13px] font-semibold text-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            🛒 Move to Cart
                          </button>
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="rounded-[7px] border border-brand-blue px-[18px] py-2 text-center text-[13px] font-semibold text-brand-blue-dark"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:w-[220px] lg:shrink-0">
              {TIPS.map(([icon, title, text]) => (
                <div key={title} className="mb-3 rounded-[10px] border border-brand-line p-3.5 text-[11.5px]">
                  <span className="text-lg">{icon}</span>
                  <br />
                  <b>{title}</b>
                  <p className="mt-1 text-brand-sub">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
