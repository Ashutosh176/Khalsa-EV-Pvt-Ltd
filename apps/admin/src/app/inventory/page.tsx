"use client";

import { useEffect, useState } from "react";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { useAuth } from "../../lib/auth-context";
import { adjustInventory, getAdminInventory } from "../../lib/api";
import type { AdminInventoryItem } from "../../lib/types";

function AdjustModal({
  item,
  onClose,
  onAdjusted,
}: {
  item: AdminInventoryItem;
  onClose: () => void;
  onAdjusted: (updated: AdminInventoryItem) => void;
}) {
  const { accessToken } = useAuth();
  const [quantityChange, setQuantityChange] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!accessToken) return;
    const change = Number(quantityChange);
    if (!change || !reason.trim()) {
      setError("Enter a non-zero quantity and a reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await adjustInventory(accessToken, item.id, change, reason.trim());
      onAdjusted(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not adjust stock");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Adjust stock</h2>
        <p className="mt-1 text-sm text-slate-500">{item.product.name}</p>
        <p className="mt-1 text-xs text-slate-400">Current: {item.currentStock} · Reserved: {item.reservedStock}</p>

        {error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p> : null}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Quantity change (+ to add, - to remove)</span>
          <input
            type="number"
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Reason</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. New shipment received, damaged in warehouse"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            {submitting ? "Saving..." : "Save"}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function InventoryContent() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<AdminInventoryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<AdminInventoryItem | null>(null);

  function reload() {
    if (!accessToken) return;
    getAdminInventory(accessToken, { search, lowStockOnly, pageSize: 100 })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
      })
      .catch(() => setItems([]));
  }

  useEffect(reload, [accessToken, search, lowStockOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Inventory</h1>
      <p className="mt-1 text-slate-500">{total} tracked items</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          type="search"
          placeholder="Search product name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-brand-green"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Warehouse</th>
              <th className="px-5 py-3 font-medium">Current</th>
              <th className="px-5 py-3 font-medium">Reserved</th>
              <th className="px-5 py-3 font-medium">Available</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  No matching inventory records.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800">{item.product.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.product.sku}
                      {item.variant ? ` · ${item.variant.color}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{item.warehouse.name}</td>
                  <td className="px-5 py-3 text-slate-600">{item.currentStock}</td>
                  <td className="px-5 py-3 text-slate-600">{item.reservedStock}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`font-semibold ${item.isLowStock ? "text-amber-600" : "text-slate-800"}`}
                    >
                      {item.availableStock}
                    </span>
                    {item.isLowStock ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Low
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setAdjustingItem(item)}
                      className="text-sm font-semibold text-brand-green hover:underline"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {adjustingItem ? (
        <AdjustModal
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onAdjusted={(updated) => {
            setItems((prev) => (prev ? prev.map((i) => (i.id === updated.id ? updated : i)) : prev));
          }}
        />
      ) : null}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <AdminShell>
      <InventoryContent />
    </AdminShell>
  );
}
