"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Button, StatCard } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { getAdminInventory, getAdminProducts, getBrands, getCategories } from "../../lib/api";
import type { AdminProduct, Brand, Category } from "../../lib/types";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-[#E8F7EA] text-[#1F8A3B]",
  INACTIVE: "bg-[#FFF3DF] text-[#B9770E]",
  ARCHIVED: "bg-[#FDE8E7] text-[#D93429]",
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  SPARE_PART: "Spare Part",
  SCOOTER: "Scooter",
  ACCESSORY: "Accessory",
};

function ProductsContent() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [activeTotal, setActiveTotal] = useState(0);
  const [lowStockTotal, setLowStockTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState("");
  const [productType, setProductType] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const pageSize = 20;

  useEffect(() => {
    getCategories().then(setCategories).catch(() => undefined);
    getBrands().then(setBrands).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAdminProducts(accessToken, {
      search,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      status: status || undefined,
      productType: productType || undefined,
      page,
      pageSize,
    })
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
  }, [accessToken, search, categoryId, brandId, status, productType, page]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([
      getAdminProducts(accessToken, { status: "ACTIVE", pageSize: 1 }),
      getAdminInventory(accessToken, { lowStockOnly: true, pageSize: 1 }),
    ])
      .then(([activeResult, lowStockResult]) => {
        if (cancelled) return;
        setActiveTotal(activeResult.total);
        setLowStockTotal(lowStockResult.total);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = products && products.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = products ? (page - 1) * pageSize + products.length : 0;

  return (
    <div>
      <AdminTopbar placeholder="Search products, categories, orders..." />

      <div className="p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[23px] font-bold">Product Management</h1>
            <p className="mt-0.5 text-[13px] text-brand-sub">Add, edit and manage all products in your store.</p>
          </div>
          <Link href="/products/new">
            <Button>+ Add New Product</Button>
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Total Products" value={String(total)} icon="📦" />
          <StatCard label="Active Products" value={String(activeTotal)} icon="✅" />
          <StatCard label="Low Stock" value={String(lowStockTotal)} icon="⚠️" />
          <StatCard label="Out of Stock" value={String(products?.filter((p) => p.inventory.reduce((s, r) => s + r.currentStock - r.reservedStock, 0) <= 0).length ?? 0)} icon="⛔" />
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1 rounded-[10px] border border-brand-line bg-white">
            <div className="flex flex-wrap gap-2.5 border-b border-brand-line p-3.5">
              <input
                type="search"
                placeholder="Search products by name, SKU, brand..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="min-w-[220px] flex-1 rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
              />
              <select
                value={categoryId}
                onChange={(e) => {
                  setPage(1);
                  setCategoryId(e.target.value);
                }}
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
                  onChange={(e) => {
                    setPage(1);
                    setBrandId(e.target.value);
                  }}
                  className="rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] text-brand-sub"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className="rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] text-brand-sub"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <select
                value={productType}
                onChange={(e) => {
                  setPage(1);
                  setProductType(e.target.value);
                }}
                className="rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] text-brand-sub"
              >
                <option value="">All Types</option>
                <option value="SPARE_PART">Spare Part</option>
                <option value="SCOOTER">Scooter</option>
                <option value="ACCESSORY">Accessory</option>
              </select>
            </div>

            <table className="dt w-full text-left text-[12.5px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                  <th className="px-4 py-2.5 font-semibold">Product</th>
                  <th className="px-4 py-2.5 font-semibold">SKU</th>
                  <th className="px-4 py-2.5 font-semibold">Category</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Price</th>
                  <th className="px-4 py-2.5 font-semibold">Stock</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {products === null ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-brand-sub">
                      Loading...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-brand-sub">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stock = product.inventory.reduce((sum, row) => sum + row.currentStock - row.reservedStock, 0);
                    return (
                      <tr key={product.id} className="border-t border-[#EFF0F1] hover:bg-brand-surface">
                        <td className="px-4 py-2.5">
                          <Link href={`/products/${product.id}`} className="flex items-center gap-2.5">
                            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-brand-line bg-gradient-to-br from-[#F2F4F1] to-[#E4E9E3] text-sm">
                              {product.images[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element -- product images are remote
                                <img src={product.images[0].url} alt={product.name} className="h-full w-full rounded-lg object-cover" />
                              ) : (
                                "🔧"
                              )}
                            </div>
                            <span className="font-bold text-brand-ink">{product.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-brand-sub">{product.sku}</td>
                        <td className="px-4 py-2.5">{product.category.name}</td>
                        <td className="px-4 py-2.5 text-brand-sub">
                          {PRODUCT_TYPE_LABELS[product.productType] ?? product.productType}
                        </td>
                        <td className="px-4 py-2.5">{formatIndianRupees(product.price)}</td>
                        <td className="px-4 py-2.5">{stock}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${STATUS_STYLES[product.status] ?? ""}`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 text-xs text-brand-sub">
              <span>
                Showing {rangeStart} to {rangeEnd} of {total} products
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

          <div className="lg:w-[220px] lg:shrink-0">
            <div className="rounded-[10px] border border-brand-line bg-white p-4">
              <b className="text-[12.5px]">Quick Actions</b>
              <Link href="/products/new" className="flex items-center justify-between border-t border-brand-line py-2.5 text-[12px]">
                ➕ Add New Product <span>›</span>
              </Link>
              <Link href="/inventory" className="flex items-center justify-between border-t border-brand-line py-2.5 text-[12px]">
                🗄️ Manage Inventory <span>›</span>
              </Link>
              <Link href="/vehicles" className="flex items-center justify-between border-t border-brand-line py-2.5 text-[12px]">
                🚗 Manage Vehicles <span>›</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
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
