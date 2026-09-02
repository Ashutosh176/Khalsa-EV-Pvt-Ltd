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
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">My account</h1>

        {!authLoading && !user ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green">
              Log in
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
            <AccountNav />

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-brand-ink">Orders</h2>

              {orders === null ? (
                <p className="text-sm text-slate-500">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-slate-600">You haven&apos;t placed any orders yet.</p>
                  <Link href="/products" className="mt-4 inline-block font-semibold text-brand-green">
                    Browse products
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-brand-ink">{order.orderNumber}</p>
                        <p className="text-xs text-slate-400">
                          Placed {new Date(order.placedAt).toLocaleDateString("en-IN")} &middot; {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatIndianRupees(order.totalAmount)}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">{order.status}</p>
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
