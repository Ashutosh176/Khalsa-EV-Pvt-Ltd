"use client";

import { useEffect, useState } from "react";
import { Button, StatCard } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { adjustInventory, getAdminInventory, getBrands, getCategories } from "../../lib/api";
import type { AdminInventoryItem, Brand, Category } from "../../lib/types";

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
      <div className="w-full max-w-sm rounded-[10px] bg-white p-5">
        <b className="text-[15px]">Adjust stock</b>
        <p className="mt-1 text-[13px] text-brand-sub">{item.product.name}</p>
        <p className="mt-1 text-xs text-brand-sub">
          Current: {item.currentStock} · Reserved: {item.reservedStock}
        </p>

        {error ? <p className="mt-3 rounded-[7px] bg-red-50 px-4 py-2 text-[12.5px] text-brand-red">{error}</p> : null}

        <label className="mt-4 block">
          <span className="text-[12.5px] font-medium text-brand-sub">Quantity change (+ to add, - to remove)</span>
          <input
            type="number"
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value)}
            className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
          />
        </label>

        <label className="mt-3.5 block">
          <span className="text-[12.5px] font-medium text-brand-sub">Reason</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. New shipment received, damaged in warehouse"
            className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
          />
        </label>

        <div className="mt-5 flex gap-3">
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

const TABS = [
  ["all", "All Items"],
  ["low", "Low Stock"],
  ["out", "Out of Stock"],
] as const;

function InventoryContent() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<AdminInventoryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [adjustingItem, setAdjustingItem] = useState<AdminInventoryItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    getCategories()
      .then((all) => setCategories(all.filter((c) => c.slug !== "electric-scooters")))
      .catch(() => undefined);
    getBrands().then(setBrands).catch(() => undefined);
  }, []);

  function reload() {
    if (!accessToken) return;
    getAdminInventory(accessToken, {
      search,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      lowStockOnly: tab === "low",
      pageSize: 100,
    })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
      })
      .catch(() => setItems([]));
  }

  useEffect(reload, [accessToken, search, categoryId, brandId, tab]);

  const visibleItems = tab === "out" ? (items ?? []).filter((i) => i.availableStock <= 0) : items;
  const totalStockUnits = (items ?? []).reduce((sum, i) => sum + i.currentStock, 0);
  const lowStockCount = (items ?? []).filter((i) => i.isLowStock).length;
  const outOfStockCount = (items ?? []).filter((i) => i.availableStock <= 0).length;

  return (
    <div>
      <AdminTopbar placeholder="Search products, orders, SKU..." />

      <div className="p-5">
        <h1 className="text-[23px] font-bold">Inventory Management</h1>
        <p className="mt-0.5 text-[13px] text-brand-sub">Track and manage your stock across all warehouses.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Total Products" value={String(total)} icon="📦" />
          <StatCard label="Total Stock (Units)" value={totalStockUnits.toLocaleString("en-IN")} icon="🗄️" />
          <StatCard label="Low Stock Items" value={String(lowStockCount)} icon="⚠️" />
          <StatCard label="Out of Stock Items" value={String(outOfStockCount)} icon="⛔" />
        </div>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          <div className="flex gap-4 border-b border-brand-line px-4 py-2.5 text-[12.5px] font-semibold text-brand-sub">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`pb-1.5 ${tab === value ? "border-b-2 border-brand-green-dark text-brand-green-dark" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 border-b border-brand-line p-3.5">
            <input
              type="search"
              placeholder="Search by product name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] text-brand-sub"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {brands.length > 0 ? (
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] text-brand-sub"
              >
                <option value="">All Models</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <table className="dt w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                <th className="px-4 py-2.5 font-semibold">Product</th>
                <th className="px-4 py-2.5 font-semibold">Warehouse</th>
                <th className="px-4 py-2.5 font-semibold">Available</th>
                <th className="px-4 py-2.5 font-semibold">Reserved</th>
                <th className="px-4 py-2.5 font-semibold">Total</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {visibleItems === null ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-sub">
                    No matching inventory records.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr key={item.id} className="border-t border-[#EFF0F1] hover:bg-brand-surface">
                    <td className="px-4 py-2.5">
                      <p className="font-bold">{item.product.name}</p>
                      <p className="text-xs text-brand-sub">
                        {item.product.sku}
                        {item.variant ? ` · ${item.variant.color}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">{item.warehouse.name}</td>
                    <td className={`px-4 py-2.5 font-bold ${item.isLowStock || item.availableStock <= 0 ? "text-brand-red" : ""}`}>
                      {item.availableStock}
                    </td>
                    <td className="px-4 py-2.5">{item.reservedStock}</td>
                    <td className="px-4 py-2.5">{item.currentStock}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                          item.availableStock <= 0
                            ? "bg-[#FDE8E7] text-[#D93429]"
                            : item.isLowStock
                              ? "bg-[#FFF3DF] text-[#B9770E]"
                              : "bg-[#E8F7EA] text-[#1F8A3B]"
                        }`}
                      >
                        {item.availableStock <= 0 ? "Out of Stock" : item.isLowStock ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => setAdjustingItem(item)} className="font-semibold text-brand-green-dark hover:underline">
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="px-4 py-3 text-xs text-brand-sub">Showing {visibleItems?.length ?? 0} of {total} items</div>
        </div>
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
