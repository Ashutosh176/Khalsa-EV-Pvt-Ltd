"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatIndianRupees } from "@khalsa-ev/utils";
import type { OrderView } from "@khalsa-ev/types";
import { Button } from "@khalsa-ev/ui";
import { Header } from "../../../../components/Header";
import { Footer } from "../../../../components/Footer";
import { AccountNav } from "../../../../components/AccountNav";
import { useAuth } from "../../../../lib/auth-context";
import { cancelOrder, getOrder } from "../../../../lib/api";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, accessToken, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getOrder(accessToken, params.id)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, params.id]);

  async function handleCancel() {
    if (!accessToken || !order) return;
    setCancelError(null);
    setCancelling(true);
    try {
      setOrder(await cancelOrder(accessToken, order.id));
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Could not cancel order.");
    } finally {
      setCancelling(false);
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
              <Link href="/account/orders" className="text-sm font-semibold text-brand-green">
                &larr; Back to orders
              </Link>

              {notFound ? (
                <p className="text-sm text-slate-500">Order not found.</p>
              ) : order === null ? (
                <p className="text-sm text-slate-500">Loading order...</p>
              ) : (
                <>
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-brand-ink">{order.orderNumber}</h2>
                        <p className="text-sm text-slate-500">
                          Placed {new Date(order.placedAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-green">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>

                    {order.status === "PENDING" ? (
                      <div className="mt-4">
                        {cancelError ? <p className="mb-2 text-sm text-red-600">{cancelError}</p> : null}
                        <Button variant="secondary" onClick={handleCancel} disabled={cancelling}>
                          {cancelling ? "Cancelling..." : "Cancel order"}
                        </Button>
                      </div>
                    ) : null}
                    {order.status === "CANCELLED" && order.cancellationReason ? (
                      <p className="mt-4 text-sm text-slate-500">Reason: {order.cancellationReason}</p>
                    ) : null}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="font-bold text-brand-ink">Status timeline</h3>
                    <ol className="mt-4 space-y-3">
                      {order.statusHistory.map((entry) => (
                        <li key={entry.id} className="flex items-start gap-3 text-sm">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                          <div>
                            <p className="font-semibold text-brand-ink">{STATUS_LABELS[entry.status] ?? entry.status}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(entry.createdAt).toLocaleString("en-IN")}
                              {entry.note ? ` · ${entry.note}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {order.shipment && (order.shipment.courierName || order.shipment.awbNumber) ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                      <h3 className="font-bold text-brand-ink">Courier & tracking</h3>
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        {order.shipment.courierName ? <p>Courier: {order.shipment.courierName}</p> : null}
                        {order.shipment.awbNumber ? <p>AWB number: {order.shipment.awbNumber}</p> : null}
                        {order.shipment.expectedDeliveryAt ? (
                          <p>Expected delivery: {new Date(order.shipment.expectedDeliveryAt).toLocaleDateString("en-IN")}</p>
                        ) : null}
                        {order.shipment.trackingUrl ? (
                          <a
                            href={order.shipment.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block font-semibold text-brand-green"
                          >
                            Track shipment
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="font-bold text-brand-ink">Items</h3>
                    <div className="mt-4 divide-y divide-slate-100">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-brand-ink">{item.productNameSnapshot}</p>
                            <p className="text-xs text-slate-400">
                              SKU: {item.skuSnapshot} &middot; Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">{formatIndianRupees(item.totalAmount)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatIndianRupees(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Shipping</span>
                        <span>{order.shippingAmount === 0 ? "Free" : formatIndianRupees(order.shippingAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-brand-ink">
                        <span>Total</span>
                        <span>{formatIndianRupees(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="font-bold text-brand-ink">Shipping address</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {order.shippingAddress.fullName} &middot; {order.shippingAddress.phone}
                      <br />
                      {order.shippingAddress.line1}
                      {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                  </div>

                  {order.status === "DELIVERED" ? (
                    <Link
                      href={`/account/returns?orderId=${order.id}`}
                      className="inline-block text-sm font-semibold text-brand-green"
                    >
                      Request a return for this order
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
