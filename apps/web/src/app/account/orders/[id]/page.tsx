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

            <div className="flex-1 space-y-4">
              <Link href="/account/orders" className="text-[12.5px] font-semibold text-brand-green-dark">
                &larr; Back to orders
              </Link>

              {notFound ? (
                <p className="text-sm text-brand-sub">Order not found.</p>
              ) : order === null ? (
                <p className="text-sm text-brand-sub">Loading order...</p>
              ) : (
                <>
                  <div className="rounded-[10px] border border-brand-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <b className="text-[15px]">{order.orderNumber}</b>
                        <p className="text-[12.5px] text-brand-sub">
                          Placed {new Date(order.placedAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>

                    {order.status === "PENDING" ? (
                      <div className="mt-3.5">
                        {cancelError ? <p className="mb-2 text-[12.5px] text-brand-red">{cancelError}</p> : null}
                        <Button variant="secondary" onClick={handleCancel} disabled={cancelling}>
                          {cancelling ? "Cancelling..." : "Cancel order"}
                        </Button>
                      </div>
                    ) : null}
                    {order.status === "CANCELLED" && order.cancellationReason ? (
                      <p className="mt-3.5 text-[12.5px] text-brand-sub">Reason: {order.cancellationReason}</p>
                    ) : null}
                  </div>

                  <div className="rounded-[10px] border border-brand-line p-4">
                    <b className="text-[13.5px]">Status timeline</b>
                    <ol className="mt-3.5 space-y-3">
                      {order.statusHistory.map((entry) => (
                        <li key={entry.id} className="flex items-start gap-2.5 text-[12.5px]">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                          <div>
                            <p className="font-bold">{STATUS_LABELS[entry.status] ?? entry.status}</p>
                            <p className="text-xs text-brand-sub">
                              {new Date(entry.createdAt).toLocaleString("en-IN")}
                              {entry.note ? ` · ${entry.note}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {order.shipment && (order.shipment.courierName || order.shipment.awbNumber) ? (
                    <div className="rounded-[10px] border border-brand-line p-4">
                      <b className="text-[13.5px]">Courier & tracking</b>
                      <div className="mt-2.5 space-y-1 text-[12.5px] text-brand-sub">
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
                            className="inline-block font-semibold text-brand-green-dark"
                          >
                            Track shipment
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[10px] border border-brand-line p-4">
                    <b className="text-[13.5px]">Items</b>
                    <div className="mt-3 divide-y divide-brand-line">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 py-2.5 text-[12.5px]">
                          <div>
                            <p className="font-bold">{item.productNameSnapshot}</p>
                            <p className="text-xs text-brand-sub">
                              SKU: {item.skuSnapshot} &middot; Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold">{formatIndianRupees(item.totalAmount)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3.5 space-y-1 border-t border-brand-line pt-3.5 text-[12.5px]">
                      <div className="flex justify-between text-brand-sub">
                        <span>Subtotal</span>
                        <span>{formatIndianRupees(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-brand-sub">
                        <span>Shipping</span>
                        <span>{order.shippingAmount === 0 ? "Free" : formatIndianRupees(order.shippingAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[14px] font-extrabold">
                        <span>Total</span>
                        <span>{formatIndianRupees(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-brand-line p-4">
                    <b className="text-[13.5px]">Shipping address</b>
                    <p className="mt-2 text-[12.5px] text-brand-sub">
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
                      className="inline-block text-[12.5px] font-semibold text-brand-green-dark"
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
