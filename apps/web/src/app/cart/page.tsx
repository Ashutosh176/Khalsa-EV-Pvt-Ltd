"use client";

import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../lib/auth-context";
import { useCart } from "../../lib/cart-context";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, updateItem, removeItem } = useCart();

  const activeItems = cart?.items.filter((item) => !item.savedForLater) ?? [];
  const savedItems = cart?.items.filter((item) => item.savedForLater) ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">Your cart</h1>

        {!authLoading && !user ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">Log in to view and manage your cart.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green">
              Log in
            </Link>
          </div>
        ) : cartLoading || authLoading ? (
          <p className="mt-8 text-sm text-slate-500">Loading your cart...</p>
        ) : activeItems.length === 0 && savedItems.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">Your cart is empty.</p>
            <Link href="/products" className="mt-4 inline-block font-semibold text-brand-green">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {activeItems.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      "🔧"
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.product.slug}`} className="font-bold text-brand-ink hover:text-brand-green">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-slate-400">SKU: {item.product.sku}</p>
                      {!item.inStock ? <p className="mt-1 text-xs font-semibold text-red-500">Insufficient stock</p> : null}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="h-8 w-8 rounded-full border border-slate-200 text-slate-600 hover:border-brand-green"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                          className="h-8 w-8 rounded-full border border-slate-200 text-slate-600 hover:border-brand-green"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-brand-ink">{formatIndianRupees(item.lineTotal)}</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { savedForLater: true })}
                        className="text-slate-500 hover:text-brand-green"
                      >
                        Save for later
                      </button>
                      <button type="button" onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-500">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {savedItems.length > 0 ? (
                <div className="pt-6">
                  <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Saved for later</h2>
                  <div className="mt-3 space-y-3">
                    {savedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                        <div>
                          <p className="font-medium text-brand-ink">{item.product.name}</p>
                          <p className="text-xs text-slate-400">{formatIndianRupees(item.unitPrice)}</p>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, { savedForLater: false })}
                            className="font-semibold text-brand-green"
                          >
                            Move to cart
                          </button>
                          <button type="button" onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-500">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {activeItems.length > 0 ? (
              <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Order summary</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>MRP total</span>
                    <span>{formatIndianRupees(cart?.totalMrp ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-brand-green">
                    <span>Savings</span>
                    <span>-{formatIndianRupees(cart?.totalSavings ?? 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-brand-ink">
                    <span>Subtotal</span>
                    <span>{formatIndianRupees(cart?.subtotal ?? 0)}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  Shipping and taxes calculated at checkout. Checkout is launching soon.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
