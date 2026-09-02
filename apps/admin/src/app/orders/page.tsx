"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { AdminShell } from "../../components/AdminShell";
import { useAuth } from "../../lib/auth-context";
import { getAdminOrders } from "../../lib/api";
import type { AdminOrderListItem } from "../../lib/types";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

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

function OrdersContent() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrderListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAdminOrders(accessToken, { search, status: status || undefined, page, pageSize })
      .then((result) => {
        if (cancelled) return;
        setOrders(result.items);
        setTotal(result.total);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, search, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Orders</h1>
      <p className="mt-1 text-slate-500">{total} orders</p>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          type="search"
          placeholder="Search order number or customer"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="min-w-[240px] flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-green"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders === null ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    <Link href={`/orders/${order.id}`} className="hover:text-brand-green">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {order.user.name}
                    <span className="block text-xs text-slate-400">{order.user.email}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{order.items.length}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{formatIndianRupees(order.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                pageNumber === page ? "bg-brand-green text-white" : "border border-slate-200 text-slate-600"
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AdminShell>
      <OrdersContent />
    </AdminShell>
  );
}
