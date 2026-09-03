"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@khalsa-ev/ui";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { AdminShell } from "../components/AdminShell";
import { AdminTopbar } from "../components/AdminTopbar";
import { useAuth } from "../lib/auth-context";
import { getAdminInventory, getAdminOrders, getAdminProducts } from "../lib/api";
import type { AdminInventoryItem, AdminOrderListItem } from "../lib/types";

const ORDER_STATUS_STYLES: Record<string, string> = {
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
    { label: "Revenue (recent)", value: formatIndianRupees(revenue), icon: "💰" },
    { label: "Orders", value: String(orderTotal), icon: "📦" },
    { label: "Products", value: String(productTotal), icon: "🧾" },
    { label: "Low stock items", value: String(lowStock?.length ?? 0), icon: "⚠️" },
  ];

  return (
    <div>
      <AdminTopbar placeholder="Search orders, customers, products..." />

      <div className="p-5">
        <h1 className="text-[23px] font-bold">Business overview</h1>
        <p className="mt-0.5 text-[13px] text-brand-sub">Track sales, inventory, and order health across your store.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
          <section className="rounded-[10px] border border-brand-line bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-brand-line px-4 py-3">
              <b className="text-[13.5px]">Recent Orders</b>
              <Link href="/orders" className="text-[11.5px] font-semibold text-brand-green-dark">
                View All →
              </Link>
            </div>

            {orders === null ? (
              <p className="p-4 text-sm text-brand-sub">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="p-4 text-sm text-brand-sub">No orders yet.</p>
            ) : (
              <table className="dt w-full text-left text-[12.5px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                    <th className="px-4 py-2.5 font-semibold">Order</th>
                    <th className="px-4 py-2.5 font-semibold">Customer</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="border-t border-[#EFF0F1]">
                      <td className="px-4 py-2.5 font-bold text-brand-green-dark">
                        <Link href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                      </td>
                      <td className="px-4 py-2.5">{order.user.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${ORDER_STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold">{formatIndianRupees(order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <aside className="rounded-[10px] border border-brand-line bg-white p-4">
            <b className="text-[13.5px]">Low Stock Alerts</b>
            <div className="mt-3 space-y-2.5">
              {lowStock === null ? (
                <p className="text-sm text-brand-sub">Loading...</p>
              ) : lowStock.length === 0 ? (
                <p className="text-sm text-brand-sub">Nothing low on stock right now.</p>
              ) : (
                lowStock.map((item) => (
                  <Link
                    key={item.id}
                    href="/inventory"
                    className="block rounded-[7px] bg-[#FFF3DF] p-3 text-[12.5px] font-medium text-[#8A5A05]"
                  >
                    {item.product.name}
                    <span className="block text-[11px] font-normal text-[#B9770E]">
                      {item.availableStock} available (threshold {item.lowStockThreshold})
                    </span>
                  </Link>
                ))
              )}
            </div>
          </aside>
        </div>
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
