"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import type { OrderView } from "@khalsa-ev/types";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { AccountNav } from "../../components/AccountNav";
import { useAuth } from "../../lib/auth-context";
import { getOrders } from "../../lib/api";

export default function AccountOverviewPage() {
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

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-brand-ink">Welcome back{user ? `, ${user.name}` : ""}</h2>
                <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
                {user?.phone ? <p className="text-sm text-slate-500">{user.phone}</p> : null}
                <Link href="/account/profile" className="mt-3 inline-block text-sm font-semibold text-brand-green">
                  Edit profile
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-brand-ink">Recent orders</h2>
                  <Link href="/account/orders" className="text-sm font-semibold text-brand-green">
                    View all
                  </Link>
                </div>

                {orders === null ? (
                  <p className="mt-4 text-sm text-slate-500">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    You haven&apos;t placed any orders yet.{" "}
                    <Link href="/products" className="font-semibold text-brand-green">
                      Start shopping
                    </Link>
                  </p>
                ) : (
                  <div className="mt-4 divide-y divide-slate-100">
                    {orders.slice(0, 3).map((order) => (
                      <Link
                        key={order.id}
                        href={`/account/orders/${order.id}`}
                        className="flex items-center justify-between gap-4 py-3 text-sm hover:text-brand-green"
                      >
                        <div>
                          <p className="font-semibold text-brand-ink">{order.orderNumber}</p>
                          <p className="text-xs text-slate-400">{new Date(order.placedAt).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatIndianRupees(order.totalAmount)}</p>
                          <p className="text-xs uppercase tracking-wide text-slate-400">{order.status}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Link
                  href="/account/addresses"
                  className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-brand-green"
                >
                  <h3 className="font-bold text-brand-ink">Addresses</h3>
                  <p className="mt-1 text-sm text-slate-500">Manage your saved shipping addresses.</p>
                </Link>
                <Link
                  href="/account/returns"
                  className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-brand-green"
                >
                  <h3 className="font-bold text-brand-ink">Returns</h3>
                  <p className="mt-1 text-sm text-slate-500">Request or track a return on a delivered order.</p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
