"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@khalsa-ev/ui";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { AdminShell } from "../components/AdminShell";
import { useAuth } from "../lib/auth-context";
import { getAdminInventory, getAdminOrders, getAdminProducts } from "../lib/api";
import type { AdminInventoryItem, AdminOrderListItem } from "../lib/types";

const ORDER_STATUS_STYLES: Record<string, string> = {
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

function DashboardContent() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrderListItem[] | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [productTotal, setProductTotal] = useState(0);
  const [lowStock, setLowStock] = useState<AdminInventoryItem[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    Promise.all([
      getAdminOrders(accessToken, { pageSize: 100 }),
      getAdminProducts(accessToken, { pageSize: 1 }),
      getAdminInventory(accessToken, { lowStockOnly: true, pageSize: 50 }),
    ])
      .then(([ordersResult, productsResult, inventoryResult]) => {
        if (cancelled) return;
        setOrders(ordersResult.items);
        setOrderTotal(ordersResult.total);
        setProductTotal(productsResult.total);
        setLowStock(inventoryResult.items);
      })
      .catch(() => {
        if (!cancelled) {
          setOrders([]);
          setLowStock([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Revenue sums only the most recent 100 orders fetched above, not a
  // true database-wide aggregate - accurate enough at current scale,
  // would need a dedicated backend aggregation endpoint beyond that.
  const revenue = (orders ?? [])
    .filter((o) => !["PENDING", "CANCELLED"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const metrics = [
    { label: "Revenue (recent)", value: formatIndianRupees(revenue) },
    { label: "Orders", value: String(orderTotal) },
    { label: "Products", value: String(productTotal) },
    { label: "Low stock items", value: String(lowStock?.length ?? 0) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Business overview</h1>
      <p className="mt-1 text-slate-500">Track sales, inventory, and order health across your store.</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">Recent orders</h3>
            <Link href="/orders" className="text-sm font-semibold text-brand-green">
              View all
            </Link>
          </div>

          {orders === null ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-semibold text-slate-800">
                        <Link href={`/orders/${order.id}`} className="hover:text-brand-green">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-600">{order.user.name}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ORDER_STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800">{formatIndianRupees(order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Low stock alerts</h3>
          <div className="mt-5 space-y-3">
            {lowStock === null ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing low on stock right now.</p>
            ) : (
              lowStock.map((item) => (
                <Link
                  key={item.id}
                  href="/inventory"
                  className="block rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 hover:border-amber-300"
                >
                  {item.product.name}
                  <span className="block text-xs font-normal text-amber-700">
                    {item.availableStock} available (threshold {item.lowStockThreshold})
                  </span>
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}
