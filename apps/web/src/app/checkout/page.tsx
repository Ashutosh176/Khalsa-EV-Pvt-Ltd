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
import { getAddresses, createOrder } from "../../lib/api";

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

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorItemId, setErrorItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

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

  async function handlePlaceOrder() {
    if (!accessToken || !selectedAddressId) return;
    setError(null);
    setErrorItemId(null);
    setPlacing(true);
    try {
      const order = await createOrder(accessToken, { shippingAddressId: selectedAddressId });
      await refreshCart();
      router.push(`/account/orders/${order.id}`);
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
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {!authLoading && !user ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to check out.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green-dark">
              Log in
            </Link>
          </div>
        ) : !cartLoading && activeItems.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Your cart is empty.</p>
            <Link href="/products" className="mt-4 inline-block font-semibold text-brand-green-dark">
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
                  <Link href="/account/addresses" className="mt-2 inline-block text-[12.5px] font-semibold text-brand-green-dark">
                    + Add an address
                  </Link>
                </div>
              ) : (
                <div className="mt-3 mb-5 grid gap-3.5 sm:grid-cols-2">
                  {addresses?.map((address) => (
                    <label
                      key={address.id}
                      className={`block cursor-pointer rounded-[10px] border p-3.5 ${
                        selectedAddressId === address.id ? "border-brand-green" : "border-brand-line"
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
                          <span className="rounded-[4px] bg-brand-green-light px-1.5 py-0.5 text-[9px] font-bold text-brand-green-dark">
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
                    className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-brand-green-dark p-3.5 text-center text-[13px] font-bold text-brand-green-dark"
                  >
                    <span className="text-xl">＋</span>
                    Add New Address
                  </Link>
                </div>
              )}

              <b className="text-sm">Delivery</b>
              <div className="mt-3 flex items-center justify-between rounded-[10px] border border-brand-green p-3.5">
                <span className="text-[13px]">
                  🚚 <b>Standard Delivery</b>
                  <div className="ml-6 text-[11.5px] text-brand-sub">Delivered in 3 - 5 working days</div>
                </span>
                <b className={shippingAmount === 0 ? "text-brand-green-dark" : ""}>
                  {shippingAmount === 0 ? "FREE" : formatIndianRupees(shippingAmount)}
                </b>
              </div>

              <p className="mt-4 text-[11.5px] text-brand-sub">
                Payment is not live yet - placing your order saves it as pending and reserves stock; you can track it from
                your account once it&apos;s confirmed.
              </p>
            </div>

            <div className="lg:w-[300px] lg:shrink-0">
              <div className="rounded-[10px] border border-brand-line p-4">
                <div className="flex items-center justify-between">
                  <b className="text-sm">Order Summary</b>
                  <Link href="/cart" className="text-[11.5px] font-semibold text-brand-green-dark">
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
                <div className="mt-3 space-y-1.5 border-t border-brand-line pt-3 text-xs">
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
                <div className="flex justify-between border-t border-brand-line pt-2.5 text-[15px] font-extrabold">
                  <span>Total Amount</span>
                  <span>{formatIndianRupees(subtotal + shippingAmount)}</span>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing || !selectedAddressId}
                  className="mt-4 w-full rounded-[7px] bg-brand-green py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placing ? "Placing order..." : "Place Order"}
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
