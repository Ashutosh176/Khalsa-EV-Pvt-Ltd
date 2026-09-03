"use client";

import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../lib/auth-context";
import { useCart } from "../../lib/cart-context";

// Matches the real, enforced values in apps/api/src/common/constants.ts
// (not exposed via a public endpoint, so mirrored here - same numbers,
// not fabricated ones).
const FREE_SHIPPING_THRESHOLD_PAISE = 299900;
const FLAT_SHIPPING_FEE_PAISE = 9900;

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, updateItem, removeItem } = useCart();

  const activeItems = cart?.items.filter((item) => !item.savedForLater) ?? [];
  const savedItems = cart?.items.filter((item) => item.savedForLater) ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE;
  const shippingAmount = activeItems.length === 0 ? 0 : qualifiesForFreeShipping ? 0 : FLAT_SHIPPING_FEE_PAISE;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD_PAISE - subtotal;
  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD_PAISE) * 100));

  return (
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      {!authLoading && !user ? (
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-7">
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to view and manage your cart.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green-dark">
              Log in
            </Link>
          </div>
        </div>
      ) : cartLoading || authLoading ? (
        <p className="px-4 py-12 text-center text-sm text-brand-sub sm:px-7">Loading your cart...</p>
      ) : activeItems.length === 0 && savedItems.length === 0 ? (
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-7">
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Your cart is empty.</p>
            <Link href="/products" className="mt-4 inline-block font-semibold text-brand-green-dark">
              Browse products
            </Link>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-7 sm:px-7 lg:flex-row lg:items-start">
          <div className="flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-[23px] font-bold">Your Cart ({activeItems.length} items)</h1>
              <Link href="/products" className="text-[12.5px] font-semibold text-brand-green-dark">
                ← Continue Shopping
              </Link>
            </div>

            {activeItems.length > 0 ? (
              <div className="mb-3.5 rounded-[10px] bg-brand-green-light p-3.5">
                {qualifiesForFreeShipping ? (
                  <div className="text-[12.5px]">🛡️ Yay! You&apos;re getting FREE delivery on this order</div>
                ) : (
                  <>
                    <div className="mb-1.5 text-[11px] text-brand-sub">
                      Add {formatIndianRupees(remainingForFreeShipping)} more to get FREE delivery
                    </div>
                    <div className="h-[5px] rounded-full bg-[#D5EAD8]">
                      <div className="h-[5px] rounded-full bg-brand-green" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {activeItems.length > 0 ? (
              <div className="rounded-[10px] border border-brand-line">
                {activeItems.map((item, i) => (
                  <div key={item.id} className={`flex flex-wrap items-center gap-3.5 p-4 ${i > 0 ? "border-t border-brand-line" : ""}`}>
                    <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-lg border border-brand-line bg-gradient-to-br from-[#F2F4F1] to-[#E4E9E3]">
                      {item.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- product images are remote
                        <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <span className="text-2xl">🔧</span>
                      )}
                    </div>
                    <div className="min-w-[160px] flex-1">
                      <Link href={`/products/${item.product.slug}`} className="text-[13px] font-bold hover:text-brand-green-dark">
                        {item.product.name}
                      </Link>
                      <div className="mt-0.5 text-[10.8px] text-brand-sub">
                        {item.inStock ? (
                          <span className="text-brand-green-dark">✓ In Stock</span>
                        ) : (
                          <span className="text-brand-red">Insufficient stock</span>
                        )}{" "}
                        <span className="text-brand-sub">· SKU: {item.product.sku}</span>
                      </div>
                      <div className="mt-1.5 flex gap-3.5 text-[11px]">
                        <button type="button" onClick={() => removeItem(item.id)} className="text-brand-red">
                          🗑 Remove
                        </button>
                        <button type="button" onClick={() => updateItem(item.id, { savedForLater: true })} className="text-brand-sub">
                          ♡ Move to Wishlist
                        </button>
                      </div>
                    </div>
                    <div className="w-[100px] shrink-0 text-right">
                      <b className="text-[13px]">{formatIndianRupees(item.unitPrice)}</b>
                      {item.mrp > item.unitPrice ? (
                        <div className="text-[10.5px] text-brand-sub line-through">{formatIndianRupees(item.mrp)}</div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5 rounded-[6px] border border-brand-line px-3 py-1 text-xs">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        className="font-bold text-brand-sub"
                      >
                        −
                      </button>
                      {item.quantity}
                      <button type="button" onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })} className="font-bold text-brand-sub">
                        +
                      </button>
                    </div>
                    <div className="w-20 shrink-0 text-right text-[13px] font-extrabold">{formatIndianRupees(item.lineTotal)}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {savedItems.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-brand-sub">Saved for later</h2>
                <div className="mt-3 space-y-3">
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-[10px] border border-brand-line p-4">
                      <div>
                        <p className="text-[13px] font-bold">{item.product.name}</p>
                        <p className="text-xs text-brand-sub">{formatIndianRupees(item.unitPrice)}</p>
                      </div>
                      <div className="flex gap-3.5 text-xs">
                        <button type="button" onClick={() => updateItem(item.id, { savedForLater: false })} className="font-semibold text-brand-green-dark">
                          Move to cart
                        </button>
                        <button type="button" onClick={() => removeItem(item.id)} className="text-brand-sub hover:text-brand-red">
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
            <div className="lg:w-[300px] lg:shrink-0">
              <div className="rounded-[10px] border border-brand-line p-4">
                <b className="text-sm">Order Summary</b>
                <div className="my-3.5 space-y-2 text-[12.5px]">
                  <div className="flex justify-between text-brand-sub">
                    <span>Subtotal ({activeItems.length} items)</span>
                    <b className="text-brand-ink">{formatIndianRupees(subtotal)}</b>
                  </div>
                  <div className="flex justify-between text-brand-sub">
                    <span>Shipping</span>
                    <b className={shippingAmount === 0 ? "text-brand-green-dark" : "text-brand-ink"}>
                      {shippingAmount === 0 ? "FREE" : formatIndianRupees(shippingAmount)}
                    </b>
                  </div>
                </div>
                <div className="flex justify-between border-t border-brand-line pt-3 text-[15px] font-extrabold">
                  <span>Total Amount</span>
                  <span>{formatIndianRupees(subtotal + shippingAmount)}</span>
                </div>
                <Link
                  href="/checkout"
                  className="mt-4 flex w-full items-center justify-center rounded-[7px] bg-brand-green py-2.5 text-[13px] font-semibold text-white hover:bg-brand-green-dark"
                >
                  Proceed to Checkout →
                </Link>
                <div className="mt-2.5 text-center text-[10.5px] text-brand-sub">Secured by VISA · MasterCard · UPI · RuPay</div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <Footer />
    </main>
  );
}
