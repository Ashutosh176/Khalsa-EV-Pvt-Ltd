"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import type { OrderView, ReturnView } from "@khalsa-ev/types";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { AccountNav } from "../../../components/AccountNav";
import { useAuth } from "../../../lib/auth-context";
import { createReturn, getOrders, getReturns } from "../../../lib/api";

export default function ReturnsPage() {
  return (
    <Suspense fallback={null}>
      <ReturnsPageInner />
    </Suspense>
  );
}

function ReturnsPageInner() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [ordersState, setOrders] = useState<OrderView[] | null>(null);
  const [returnsState, setReturns] = useState<ReturnView[] | null>(null);
  const orders = accessToken ? ordersState : null;
  const returns = accessToken ? returnsState : null;
  const deliveredOrders = (orders ?? []).filter((o) => o.status === "DELIVERED");

  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [orderItemId, setOrderItemId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([getOrders(accessToken), getReturns(accessToken)])
      .then(([orderResult, returnResult]) => {
        if (!cancelled) {
          setOrders(orderResult);
          setReturns(returnResult);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrders([]);
          setReturns([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const selectedOrder = deliveredOrders.find((o) => o.id === orderId) ?? null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createReturn(accessToken, {
        orderId,
        orderItemId: orderItemId || undefined,
        reason,
      });
      setReturns((prev) => [created, ...(prev ?? [])]);
      setSuccess(true);
      setOrderId("");
      setOrderItemId("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit return request.");
    } finally {
      setSubmitting(false);
    }
  }

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
                <h2 className="text-lg font-bold text-brand-ink">Request a return</h2>
                <p className="mt-1 text-sm text-slate-500">Only delivered orders are eligible for a return.</p>

                {deliveredOrders.length === 0 && orders !== null ? (
                  <p className="mt-4 text-sm text-slate-500">You don&apos;t have any delivered orders to return.</p>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {error ? (
                      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    ) : null}
                    {success ? (
                      <p className="rounded-xl bg-brand-green/10 px-4 py-3 text-sm text-brand-green" role="status">
                        Return request submitted.
                      </p>
                    ) : null}

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Order</span>
                      <select
                        required
                        value={orderId}
                        onChange={(e) => {
                          setOrderId(e.target.value);
                          setOrderItemId("");
                        }}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                      >
                        <option value="" disabled>
                          Select a delivered order
                        </option>
                        {deliveredOrders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.orderNumber}
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedOrder ? (
                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">Item (optional - leave blank for whole order)</span>
                        <select
                          value={orderItemId}
                          onChange={(e) => setOrderItemId(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                        >
                          <option value="">Whole order</option>
                          {selectedOrder.items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.productNameSnapshot}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Reason</span>
                      <textarea
                        required
                        minLength={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                      />
                    </label>

                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit return request"}
                    </Button>
                  </form>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-brand-ink">Your return requests</h2>

                {returns === null ? (
                  <p className="mt-4 text-sm text-slate-500">Loading...</p>
                ) : returns.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No return requests yet.</p>
                ) : (
                  <div className="mt-4 divide-y divide-slate-100">
                    {returns.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-brand-ink">{r.order.orderNumber}</p>
                          <p className="text-xs text-slate-400">{r.reason}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
