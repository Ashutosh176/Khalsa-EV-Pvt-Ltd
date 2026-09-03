"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import type { Address, OrderView, WishlistItemView } from "@khalsa-ev/types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AccountNav } from "../../components/AccountNav";
import { useAuth } from "../../lib/auth-context";
import { getAddresses, getOrders, getWishlist } from "../../lib/api";

const IN_TRANSIT_STATUSES = new Set(["PACKED", "SHIPPED", "OUT_FOR_DELIVERY"]);

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: "bg-[#E8F7EA] text-[#1F8A3B]",
  PACKED: "bg-[#FFF3DF] text-[#B9770E]",
  SHIPPED: "bg-[#FFF3DF] text-[#B9770E]",
  OUT_FOR_DELIVERY: "bg-[#FFF3DF] text-[#B9770E]",
  CANCELLED: "bg-[#FDE8E7] text-[#D93429]",
  RETURNED: "bg-[#FDE8E7] text-[#D93429]",
  PENDING: "bg-[#E7F0FE] text-[#2563C6]",
  CONFIRMED: "bg-[#E7F0FE] text-[#2563C6]",
  PROCESSING: "bg-[#E7F0FE] text-[#2563C6]",
};

export default function AccountOverviewPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItemView[] | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([getOrders(accessToken), getWishlist(accessToken), getAddresses(accessToken)])
      .then(([orderResult, wishlistResult, addressResult]) => {
        if (cancelled) return;
        setOrders(orderResult);
        setWishlist(wishlistResult);
        setAddresses(addressResult);
      })
      .catch(() => {
        if (!cancelled) {
          setOrders([]);
          setWishlist([]);
          setAddresses([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const inTransitCount = orders?.filter((o) => IN_TRANSIT_STATUSES.has(o.status)).length ?? 0;
  const deliveredCount = orders?.filter((o) => o.status === "DELIVERED").length ?? 0;
  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0] ?? null;

  return (
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {!authLoading && !user ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green-dark">
              Log in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <AccountNav />

            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between rounded-[10px] border border-brand-line p-4">
                <div>
                  <b className="text-base">Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}! 👋</b>
                  <p className="mt-1 text-[13px] text-brand-sub">Here&apos;s what&apos;s happening with your account today.</p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["📦", orders?.length ?? "—", "Orders Placed"],
                  ["🚚", inTransitCount, "Orders In Transit"],
                  ["✅", deliveredCount, "Orders Delivered"],
                  ["♡", wishlist?.length ?? "—", "Wishlist Items"],
                ].map(([icon, value, label]) => (
                  <div key={label} className="rounded-[10px] border border-brand-line p-3.5">
                    <span className="text-lg">{icon}</span>
                    <div className="mt-1.5 text-xl font-extrabold">{value}</div>
                    <div className="text-[11px] text-brand-sub">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-[10px] border border-brand-line p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <b className="text-[13.5px]">Recent Orders</b>
                  <Link href="/account/orders" className="text-[11.5px] font-semibold text-brand-green-dark">
                    View All Orders →
                  </Link>
                </div>

                {orders === null ? (
                  <p className="text-sm text-brand-sub">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-brand-sub">
                    You haven&apos;t placed any orders yet.{" "}
                    <Link href="/products" className="font-semibold text-brand-green-dark">
                      Start shopping
                    </Link>
                  </p>
                ) : (
                  orders.slice(0, 4).map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-line py-2.5 text-xs first:border-t-0"
                    >
                      <b>Order #{order.orderNumber}</b>
                      <span>{formatIndianRupees(order.totalAmount)}</span>
                      <span className="text-brand-sub">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span>›</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="lg:w-[260px] lg:shrink-0">
              <div className="mb-3.5 rounded-[10px] border border-brand-line p-4">
                <b className="text-[13px]">Delivery Address</b>
                {defaultAddress ? (
                  <div className="mt-2 text-[11.8px]">
                    📍 {defaultAddress.fullName}{" "}
                    {defaultAddress.isDefault ? (
                      <span className="rounded-[4px] bg-brand-green-light px-1.5 py-0.5 text-[9px] font-bold text-brand-green-dark">
                        Default
                      </span>
                    ) : null}
                    <br />
                    {defaultAddress.line1}, {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
                  </div>
                ) : (
                  <div className="mt-2 text-[11.8px] text-brand-sub">
                    No saved address yet.{" "}
                    <Link href="/account/addresses" className="font-semibold text-brand-green-dark">
                      Add one
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-[10px] border border-brand-line p-4">
                <b className="text-[12.5px]">Quick Actions</b>
                {(
                  [
                    ["🚚", "Track Your Order", "/account/orders"],
                    ["♡", "Browse Wishlist", "/wishlist"],
                    ["📍", "Manage Addresses", "/account/addresses"],
                    ["↩️", "Returns & Refunds", "/account/returns"],
                  ] as const
                ).map(([icon, label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between border-t border-brand-line py-2 text-[11.8px]"
                  >
                    <span>
                      {icon} {label}
                    </span>
                    <span>›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
