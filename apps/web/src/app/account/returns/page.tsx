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
    <main className="theme-scooters min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {!authLoading && !user ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-blue-dark">
              Log in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <AccountNav />

            <div className="flex-1 space-y-4">
              <div className="rounded-[10px] border border-brand-line p-4">
                <b className="text-[15px]">Request a return</b>
                <p className="mt-1 text-[12.5px] text-brand-sub">Only delivered orders are eligible for a return.</p>

                {deliveredOrders.length === 0 && orders !== null ? (
                  <p className="mt-3.5 text-[12.5px] text-brand-sub">You don&apos;t have any delivered orders to return.</p>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5">
                    {error ? (
                      <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
                        {error}
                      </p>
                    ) : null}
                    {success ? (
                      <p className="rounded-[7px] bg-brand-blue-light px-4 py-2.5 text-[12.5px] text-brand-blue-dark" role="status">
                        Return request submitted.
                      </p>
                    ) : null}

                    <label className="block">
                      <span className="text-[12.5px] font-medium text-brand-sub">Order</span>
                      <select
                        required
                        value={orderId}
                        onChange={(e) => {
                          setOrderId(e.target.value);
                          setOrderItemId("");
                        }}
                        className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-blue"
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
                        <span className="text-[12.5px] font-medium text-brand-sub">Item (optional - leave blank for whole order)</span>
                        <select
                          value={orderItemId}
                          onChange={(e) => setOrderItemId(e.target.value)}
                          className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-blue"
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
                      <span className="text-[12.5px] font-medium text-brand-sub">Reason</span>
                      <textarea
                        required
                        minLength={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-blue"
                      />
                    </label>

                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit return request"}
                    </Button>
                  </form>
                )}
              </div>

              <div className="rounded-[10px] border border-brand-line p-4">
                <b className="text-[15px]">Your return requests</b>

                {returns === null ? (
                  <p className="mt-3.5 text-[12.5px] text-brand-sub">Loading...</p>
                ) : returns.length === 0 ? (
                  <p className="mt-3.5 text-[12.5px] text-brand-sub">No return requests yet.</p>
                ) : (
                  <div className="mt-3.5 divide-y divide-brand-line">
                    {returns.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-4 py-2.5 text-[12.5px]">
                        <div>
                          <p className="font-bold">{r.order.orderNumber}</p>
                          <p className="text-xs text-brand-sub">{r.reason}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-600">
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
