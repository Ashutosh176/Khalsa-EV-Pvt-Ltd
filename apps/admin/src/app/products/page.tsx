"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { useAuth } from "../../lib/auth-context";
import { getAdminProducts } from "../../lib/api";
import type { AdminProduct } from "../../lib/types";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-red-100 text-red-700",
};

function ProductsContent() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAdminProducts(accessToken, { search, status: status || undefined, page, pageSize })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.items);
        setTotal(result.total);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, search, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">{total} products</p>
        </div>
        <Link href="/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          type="search"
          placeholder="Search name, SKU, part number"
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
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {products === null ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-slate-500">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const stock = product.inventory.reduce((sum, row) => sum + row.currentStock - row.reservedStock, 0);
                return (
                  <tr key={product.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      <Link href={`/products/${product.id}`} className="hover:text-brand-green">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{product.sku}</td>
                    <td className="px-5 py-3 text-slate-600">{product.category.name}</td>
                    <td className="px-5 py-3 text-slate-600">{formatIndianRupees(product.price)}</td>
                    <td className="px-5 py-3 text-slate-600">{stock}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[product.status] ?? ""}`}
                      >
                        {product.status}
                      </span>
                    </td>
                  </tr>
                );
              })
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

export default function ProductsPage() {
  return (
    <AdminShell>
      <ProductsContent />
    </AdminShell>
  );
}
