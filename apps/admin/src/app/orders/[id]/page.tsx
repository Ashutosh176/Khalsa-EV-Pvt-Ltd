"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../../components/AdminShell";
import { useAuth } from "../../../lib/auth-context";
import { getAdminOrder, updateOrderShipment, updateOrderStatus } from "../../../lib/api";
import type { AdminOrderDetail, OrderStatus, ShipmentInfo } from "../../../lib/types";

// Mirrors apps/api/src/orders/order-status.ts - kept in sync manually.
// This only controls which buttons are shown; the backend is still the
// authoritative check on every request.
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
  REFUNDED: [],
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  PACKED: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-amber-100 text-amber-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-red-100 text-red-700",
  REFUNDED: "bg-red-100 text-red-700",
};

function OrderDetailContent({ id }: { id: string }) {
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reload() {
    if (!accessToken) return;
    getAdminOrder(accessToken, id)
      .then(setOrder)
      .catch(() => setNotFound(true));
  }

  useEffect(reload, [accessToken, id]);

  async function handleStatusChange(nextStatus: OrderStatus) {
    if (!accessToken) return;
    const requiresNote = nextStatus === "CANCELLED" || nextStatus === "RETURNED";
    let note: string | undefined;
    if (requiresNote) {
      note = window.prompt(`Note for marking this order ${nextStatus}:`) ?? undefined;
      if (note === undefined) return; // cancelled the prompt
    }

    setBusy(true);
    setError(null);
    try {
      const updated = await updateOrderStatus(accessToken, id, nextStatus, note);
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order status");
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Order not found.</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUSES[order.status];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{order.orderNumber}</h1>
          <p className="mt-1 text-slate-500">
            Placed {new Date(order.createdAt).toLocaleString("en-IN")} by {order.user.name} ({order.user.email})
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${STATUS_STYLES[order.status] ?? ""}`}>
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      {nextStatuses.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((next) => (
            <Button
              key={next}
              variant={next === "CANCELLED" ? "secondary" : "primary"}
              disabled={busy}
              onClick={() => handleStatusChange(next)}
            >
              Mark as {next.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Items</h2>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{item.productNameSnapshot}</p>
                    <p className="text-xs text-slate-400">
                      SKU: {item.skuSnapshot} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-800">{formatIndianRupees(item.totalAmount)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatIndianRupees(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{formatIndianRupees(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (inclusive)</span>
                <span>{formatIndianRupees(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatIndianRupees(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Shipping address</h2>
            <p className="mt-2 text-sm text-slate-600">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? <>, {order.shippingAddress.line2}</> : null}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              <br />
              Phone: {order.shippingAddress.phone}
            </p>
          </section>

          <ShipmentSection key={order.id} orderId={order.id} shipment={order.shipment} onSaved={setOrder} />
        </div>

        <section className="h-fit rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Status timeline</h2>
          <div className="mt-4 space-y-4">
            {order.statusHistory.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-green" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{entry.status.replace(/_/g, " ")}</p>
                  {entry.note ? <p className="text-xs text-slate-500">{entry.note}</p> : null}
                  <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ShipmentSection({
  orderId,
  shipment,
  onSaved,
}: {
  orderId: string;
  shipment: ShipmentInfo | null;
  onSaved: (order: AdminOrderDetail) => void;
}) {
  const { accessToken } = useAuth();
  const [courierName, setCourierName] = useState(shipment?.courierName ?? "");
  const [awbNumber, setAwbNumber] = useState(shipment?.awbNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(shipment?.trackingUrl ?? "");
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState(
    shipment?.expectedDeliveryAt ? shipment.expectedDeliveryAt.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateOrderShipment(accessToken, orderId, {
        courierName: courierName || undefined,
        awbNumber: awbNumber || undefined,
        trackingUrl: trackingUrl || undefined,
        expectedDeliveryAt: expectedDeliveryAt ? new Date(expectedDeliveryAt).toISOString() : undefined,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save shipment details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">Courier & tracking</h2>
      <p className="mt-1 text-xs text-slate-400">
        No Shiprocket credentials yet - entered manually. Shipment status ({shipment?.status ?? "PENDING"}) tracks the
        order status above automatically.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error ? <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Courier name</span>
            <input
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">AWB number</span>
            <input
              value={awbNumber}
              onChange={(e) => setAwbNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Tracking URL</span>
          <input
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-600">Expected delivery date</span>
          <input
            type="date"
            value={expectedDeliveryAt}
            onChange={(e) => setExpectedDeliveryAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save shipment details"}
        </Button>
      </form>
    </section>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <OrderDetailContent id={id} />
    </AdminShell>
  );
}
