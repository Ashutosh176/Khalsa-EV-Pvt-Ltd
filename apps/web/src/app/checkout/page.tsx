"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatIndianRupees } from "@khalsa-ev/utils";
import type { Address } from "@khalsa-ev/types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../lib/auth-context";
import { useCart } from "../../lib/cart-context";
import { getAddresses, createOrder, validateCoupon } from "../../lib/api";
import { useRazorpayCheckout } from "../../lib/useRazorpayCheckout";

const FREE_SHIPPING_THRESHOLD_PAISE = 299900;
const FLAT_SHIPPING_FEE_PAISE = 9900;

// createFromCart rejects with the offending product name embedded in the
// message (e.g. `"X" is no longer available`, `Insufficient stock for
// "X"`) rather than a structured product/item id - this pulls the name
// back out so the UI can point at the exact cart line instead of just
// showing the raw error text with no way to act on it.
function findErrorItemId(message: string, items: { id: string; product: { name: string } }[]): string | null {
  const name = message.match(/"([^"]+)"/)?.[1];
  if (!name) return null;
  return items.find((item) => item.product.name === name)?.id ?? null;
}

export default function CheckoutPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refresh: refreshCart, removeItem } = useCart();
  const router = useRouter();
  const payForOrder = useRazorpayCheckout();

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorItemId, setErrorItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAddresses(accessToken)
      .then((result) => {
        if (cancelled) return;
        setAddresses(result);
        const defaultAddress = result.find((a) => a.isDefault) ?? result[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const activeItems = cart?.items.filter((item) => !item.savedForLater) ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE || activeItems.length === 0 ? 0 : FLAT_SHIPPING_FEE_PAISE;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;

  async function handleApplyCoupon() {
    if (!accessToken || !couponInput.trim()) return;
    setCouponError(null);
    setApplyingCoupon(true);
    try {
      const result = await validateCoupon(accessToken, couponInput.trim());
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Could not apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function handlePlaceOrder() {
    if (!accessToken || !selectedAddressId) return;
    setError(null);
    setErrorItemId(null);
    setPlacing(true);
    try {
      const order = await createOrder(accessToken, {
        shippingAddressId: selectedAddressId,
        couponCode: appliedCoupon?.code,
      });
      await payForOrder(
        accessToken,
        order,
        user ?? {},
        (message) => {
          setError(message);
          setPlacing(false);
        },
        refreshCart,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not place order";
      setError(message);
      setErrorItemId(findErrorItemId(message, activeItems));
      setPlacing(false);
    }
  }

  async function handleRemoveErrorItem() {
    if (!errorItemId) return;
    setRemovingItemId(errorItemId);
    try {
      await removeItem(errorItemId);
      setError(null);
      setErrorItemId(null);
    } finally {
      setRemovingItemId(null);
    }
  }

  const loading = authLoading || cartLoading || addresses === null;

  return (
    <main className="theme-scooters min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {!authLoading && !user ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to check out.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-blue-dark">
              Log in
            </Link>
          </div>
        ) : !cartLoading && activeItems.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Your cart is empty.</p>
            <Link href="/products" className="mt-4 inline-block font-semibold text-brand-blue-dark">
              Browse products
            </Link>
          </div>
        ) : loading ? (
          <p className="text-sm text-brand-sub">Loading checkout...</p>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1">
              <h1 className="mb-5 text-[23px] font-bold">Checkout</h1>

              <b className="text-sm">Delivery Address</b>

              {error ? <p className="mt-3 rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red">{error}</p> : null}

              {addresses && addresses.length === 0 ? (
                <div className="mt-3 rounded-[10px] border border-dashed border-brand-line p-6 text-center">
                  <p className="text-[13px] text-brand-sub">You don&apos;t have any saved addresses yet.</p>
                  <Link href="/account/addresses" className="mt-2 inline-block text-[12.5px] font-semibold text-brand-blue-dark">
                    + Add an address
                  </Link>
                </div>
              ) : (
                <div className="mt-3 mb-5 grid gap-3.5 sm:grid-cols-2">
                  {addresses?.map((address) => (
                    <label
                      key={address.id}
                      className={`block cursor-pointer rounded-[10px] border p-3.5 ${
                        selectedAddressId === address.id ? "border-brand-blue" : "border-brand-line"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex items-center gap-2 text-[13px]">
                          <input
                            type="radio"
                            name="addressId"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                          />
                          🏠 <b>{address.fullName}</b>
                        </span>
                        {address.isDefault ? (
                          <span className="rounded-[4px] bg-brand-blue-light px-1.5 py-0.5 text-[9px] font-bold text-brand-blue-dark">
                            DEFAULT
                          </span>
                        ) : null}
                      </div>
                      <div className="my-1.5 text-xs text-brand-sub">
                        {address.phone}
                        <br />
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
                      </div>
                    </label>
                  ))}
                  <Link
                    href="/account/addresses"
                    className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-brand-blue-dark p-3.5 text-center text-[13px] font-bold text-brand-blue-dark"
                  >
                    <span className="text-xl">＋</span>
                    Add New Address
                  </Link>
                </div>
              )}

              <b className="text-sm">Delivery</b>
              <div className="mt-3 flex items-center justify-between rounded-[10px] border border-brand-blue p-3.5">
                <span className="text-[13px]">
                  🚚 <b>Standard Delivery</b>
                  <div className="ml-6 text-[11.5px] text-brand-sub">Delivered in 3 - 5 working days</div>
                </span>
                <b className={shippingAmount === 0 ? "text-brand-blue-dark" : ""}>
                  {shippingAmount === 0 ? "FREE" : formatIndianRupees(shippingAmount)}
                </b>
              </div>

              <p className="mt-4 text-[11.5px] text-brand-sub">
                🔒 Secure payments powered by Razorpay - cards, UPI, netbanking and wallets accepted.
              </p>
            </div>

            <div className="lg:w-[300px] lg:shrink-0">
              <div className="rounded-[10px] border border-brand-line p-4">
                <div className="flex items-center justify-between">
                  <b className="text-sm">Order Summary</b>
                  <Link href="/cart" className="text-[11.5px] font-semibold text-brand-blue-dark">
                    Edit Cart
                  </Link>
                </div>
                <div className="mt-3 space-y-2.5">
                  {activeItems.map((item) => {
                    const hasError = item.id === errorItemId;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2.5 ${hasError ? "rounded-lg bg-red-50 p-1.5" : ""}`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-line bg-gradient-to-br from-[#F2F4F1] to-[#E4E9E3] text-base">
                          {item.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- product images are remote
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full rounded-lg object-cover" />
                          ) : (
                            "🔧"
                          )}
                        </div>
                        <div className="flex-1 text-[11.8px]">
                          {item.product.name}
                          <br />
                          <span className="text-brand-sub">Qty: {item.quantity}</span>
                        </div>
                        {hasError ? (
                          <button
                            type="button"
                            onClick={handleRemoveErrorItem}
                            disabled={removingItemId === item.id}
                            className="text-[11px] font-semibold text-brand-red underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingItemId === item.id ? "Removing..." : "Remove"}
                          </button>
                        ) : (
                          <b className="text-xs">{formatIndianRupees(item.lineTotal)}</b>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3.5 border-t border-brand-line pt-3.5">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-[7px] bg-brand-blue-light px-3 py-2 text-[11.5px]">
                      <span className="font-semibold text-brand-blue-dark">🎟️ {appliedCoupon.code} applied</span>
                      <button type="button" onClick={handleRemoveCoupon} className="font-semibold text-brand-red underline">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-blue"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="rounded-[7px] border border-brand-blue-dark px-3.5 py-2 text-[12.5px] font-semibold text-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {applyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError ? <p className="mt-1.5 text-[11.5px] text-brand-red">{couponError}</p> : null}
                </div>

                <div className="mt-3 space-y-1.5 border-t border-brand-line pt-3 text-xs">
                  <div className="flex justify-between text-brand-sub">
                    <span>Subtotal ({activeItems.length} items)</span>
                    <b className="text-brand-ink">{formatIndianRupees(subtotal)}</b>
                  </div>
                  {appliedCoupon ? (
                    <div className="flex justify-between text-brand-sub">
                      <span>Coupon discount</span>
                      <b className="text-brand-blue-dark">-{formatIndianRupees(discountAmount)}</b>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-brand-sub">
                    <span>Shipping</span>
                    <b className={shippingAmount === 0 ? "text-brand-blue-dark" : "text-brand-ink"}>
                      {shippingAmount === 0 ? "FREE" : formatIndianRupees(shippingAmount)}
                    </b>
                  </div>
                </div>
                <div className="flex justify-between border-t border-brand-line pt-2.5 text-[15px] font-extrabold">
                  <span>Total Amount</span>
                  <span>{formatIndianRupees(subtotal - discountAmount + shippingAmount)}</span>
                </div>

                <button 
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing || !selectedAddressId}
                  className="mt-4 w-full rounded-[7px] bg-brand-blue py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placing ? "Redirecting to payment..." : "Proceed to Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
