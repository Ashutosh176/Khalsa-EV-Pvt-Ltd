"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { getAdminOrders } from "../../lib/api";
import type { AdminOrderListItem } from "../../lib/types";

const STATUS_TABS = [
  ["", "All Orders"],
  ["PENDING", "Pending"],
  ["PROCESSING", "Processing"],
  ["SHIPPED", "Shipped"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled"],
  ["RETURNED", "Returned"],
] as const;

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
  const rangeStart = orders && orders.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = orders ? (page - 1) * pageSize + orders.length : 0;

  return (
    <div>
      <AdminTopbar placeholder="Search orders, customers, products..." />

      <div className="p-5">
        <h1 className="text-[23px] font-bold">Order Management</h1>
        <p className="mt-0.5 text-[13px] text-brand-sub">View, manage and track all customer orders.</p>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          <div className="flex gap-4 overflow-x-auto border-b border-brand-line px-4 py-2.5 text-[12.5px] font-semibold text-brand-sub">
            {STATUS_TABS.map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatus(value);
                }}
                className={`shrink-0 whitespace-nowrap pb-1.5 ${
                  status === value ? "border-b-2 border-brand-green-dark text-brand-green-dark" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 border-b border-brand-line p-3.5">
            <input
              type="search"
              placeholder="Search by Order ID, Customer, Phone, Email..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="flex-1 rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
            />
          </div>

          <table className="dt w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                <th className="px-4 py-2.5 font-semibold">Order ID</th>
                <th className="px-4 py-2.5 font-semibold">Customer</th>
                <th className="px-4 py-2.5 font-semibold">Items</th>
                <th className="px-4 py-2.5 font-semibold">Amount</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders === null ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-brand-sub">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-[#EFF0F1] hover:bg-brand-surface">
                    <td className="px-4 py-2.5 font-bold text-brand-green-dark">
                      <Link href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <b>{order.user.name}</b>
                      <span className="block text-[11px] text-brand-sub">{order.user.email}</span>
                    </td>
                    <td className="px-4 py-2.5">{order.items.length}</td>
                    <td className="px-4 py-2.5 font-bold">{formatIndianRupees(order.totalAmount)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-brand-sub">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 text-xs text-brand-sub">
            <span>
              Showing {rangeStart} to {rangeEnd} of {total} orders
            </span>
            {totalPages > 1 ? (
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`rounded-[6px] px-2.5 py-1 font-semibold ${
                      pageNumber === page ? "bg-brand-green text-white" : "border border-brand-line text-brand-ink"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
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
