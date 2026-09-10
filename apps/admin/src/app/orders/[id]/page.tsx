"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../../components/AdminShell";
import { AdminTopbar } from "../../../components/AdminTopbar";
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
      <div>
        <AdminTopbar />
        <p className="p-5 text-brand-sub">Order not found.</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <AdminTopbar />
        <p className="p-5 text-brand-sub">Loading...</p>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUSES[order.status];

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[21px] font-bold">{order.orderNumber}</h1>
            <p className="mt-1 text-[13px] text-brand-sub">
              Placed {new Date(order.createdAt).toLocaleString("en-IN")} by {order.user.name} ({order.user.email})
            </p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>

        {error ? <p className="mt-4 rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red">{error}</p> : null}

        {nextStatuses.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-2">
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

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <section className="rounded-[10px] border border-brand-line bg-white p-4">
              <b className="text-[15px]">Items</b>
              <div className="mt-3 space-y-2.5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-brand-line pb-2.5 last:border-0">
                    <div>
                      <p className="text-[13px] font-medium">{item.productNameSnapshot}</p>
                      <p className="text-xs text-brand-sub">
                        SKU: {item.skuSnapshot} · Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold">{formatIndianRupees(item.totalAmount)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3.5 space-y-1.5 border-t border-brand-line pt-3.5 text-[12.5px]">
                <div className="flex justify-between text-brand-sub">
                  <span>Subtotal</span>
                  <span>{formatIndianRupees(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 ? (
                  <div className="flex justify-between text-brand-sub">
                    <span>Coupon discount</span>
                    <span>-{formatIndianRupees(order.discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-brand-sub">
                  <span>Shipping</span>
                  <span>{formatIndianRupees(order.shippingAmount)}</span>
                </div>
                <div className="flex justify-between text-brand-sub">
                  <span>Tax (inclusive)</span>
                  <span>{formatIndianRupees(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-line pt-1.5 text-[14px] font-extrabold">
                  <span>Total</span>
                  <span>{formatIndianRupees(order.totalAmount)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-brand-line bg-white p-4">
              <b className="text-[15px]">Shipping address</b>
              <p className="mt-2 text-[12.5px] text-brand-sub">
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

          <section className="h-fit rounded-[10px] border border-brand-line bg-white p-4">
            <b className="text-[15px]">Status timeline</b>
            <div className="mt-3.5 space-y-3.5">
              {order.statusHistory.map((entry) => (
                <div key={entry.id} className="flex gap-2.5">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-green" />
                  <div>
                    <p className="text-[12.5px] font-bold">{entry.status.replace(/_/g, " ")}</p>
                    {entry.note ? <p className="text-xs text-brand-sub">{entry.note}</p> : null}
                    <p className="text-xs text-brand-sub">{new Date(entry.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
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
    <section className="rounded-[10px] border border-brand-line bg-white p-4">
      <b className="text-[15px]">Courier & tracking</b>
      <p className="mt-1 text-xs text-brand-sub">
        No Shiprocket credentials yet - entered manually. Shipment status ({shipment?.status ?? "PENDING"}) tracks the
        order status above automatically.
      </p>

      <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
        {error ? <p className="rounded-[7px] bg-red-50 px-4 py-2 text-[12.5px] text-brand-red">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-brand-sub">Courier name</span>
            <input
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-brand-sub">AWB number</span>
            <input
              value={awbNumber}
              onChange={(e) => setAwbNumber(e.target.value)}
              className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Tracking URL</span>
          <input
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Expected delivery date</span>
          <input
            type="date"
            value={expectedDeliveryAt}
            onChange={(e) => setExpectedDeliveryAt(e.target.value)}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
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
