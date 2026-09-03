"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import type { OrderView } from "@khalsa-ev/types";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { AccountNav } from "../../../components/AccountNav";
import { useAuth } from "../../../lib/auth-context";
import { getOrders } from "../../../lib/api";

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

export default function OrdersPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [ordersState, setOrders] = useState<OrderView[] | null>(null);
  const orders = accessToken ? ordersState : null;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getOrders(accessToken)
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

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

            <div className="flex-1 space-y-3.5">
              <h1 className="text-[18px] font-bold">My Orders</h1>

              {orders === null ? (
                <p className="text-sm text-brand-sub">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
                  <p className="text-brand-sub">You haven&apos;t placed any orders yet.</p>
                  <Link href="/products" className="mt-4 inline-block font-semibold text-brand-green-dark">
                    Browse products
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-brand-line rounded-[10px] border border-brand-line">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-[13px] hover:bg-brand-surface"
                    >
                      <div>
                        <p className="font-bold">{order.orderNumber}</p>
                        <p className="text-xs text-brand-sub">
                          Placed {new Date(order.placedAt).toLocaleDateString("en-IN")} &middot; {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatIndianRupees(order.totalAmount)}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
