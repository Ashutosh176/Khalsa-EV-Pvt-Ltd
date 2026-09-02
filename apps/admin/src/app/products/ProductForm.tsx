"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import { useAuth } from "../../lib/auth-context";
import { createProduct, getBrands, getCategories, updateProduct } from "../../lib/api";
import type { AdminProduct, Brand, Category, ProductStatus } from "../../lib/types";

type Props = {
  mode: "create" | "edit";
  product?: AdminProduct;
};

function paiseToRupeeString(paise: number): string {
  return (paise / 100).toString();
}

export function ProductForm({ mode, product }: Props) {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [partNumber, setPartNumber] = useState(product?.partNumber ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceRupees, setPriceRupees] = useState(product ? paiseToRupeeString(product.price) : "");
  const [mrpRupees, setMrpRupees] = useState(product ? paiseToRupeeString(product.mrp) : "");
  const [gstPercent, setGstPercent] = useState(product?.gstPercent ?? "18");
  const [warrantyMonths, setWarrantyMonths] = useState(
    product?.warrantyMonths != null ? String(product.warrantyMonths) : "",
  );
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "DRAFT");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [initialStock, setInitialStock] = useState("0");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getBrands()
      .then(setBrands)
      .catch(() => setBrands([]));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);

    try {
      const priceInPaise = Math.round(Number(priceRupees) * 100);
      const mrpInPaise = Math.round(Number(mrpRupees) * 100);

      if (mode === "create") {
        const created = await createProduct(accessToken, {
          sku,
          name,
          categoryId,
          brandId: brandId || undefined,
          partNumber: partNumber || undefined,
          description: description || undefined,
          price: priceInPaise,
          mrp: mrpInPaise,
          gstPercent: gstPercent ? Number(gstPercent) : undefined,
          warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
          status,
          isFeatured,
          initialStock: initialStock ? Number(initialStock) : undefined,
        });
        router.push(`/products/${created.id}`);
      } else if (product) {
        await updateProduct(accessToken, product.id, {
          sku,
          name,
          categoryId,
          brandId: brandId || undefined,
          partNumber: partNumber || undefined,
          description: description || undefined,
          price: priceInPaise,
          mrp: mrpInPaise,
          gstPercent: gstPercent ? Number(gstPercent) : undefined,
          warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
          status,
          isFeatured,
        });
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6">
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Product name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">SKU</span>
          <input
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Brand (optional)</span>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">No brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Part number (optional)</span>
          <input
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Price (₹)</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={priceRupees}
            onChange={(e) => setPriceRupees(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">MRP (₹)</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={mrpRupees}
            onChange={(e) => setMrpRupees(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">GST %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={gstPercent}
            onChange={(e) => setGstPercent(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Warranty (months, optional)</span>
          <input
            type="number"
            min="0"
            value={warrantyMonths}
            onChange={(e) => setWarrantyMonths(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
          />
        </label>

        {mode === "create" ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Initial stock</span>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
            />
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
        <span className="text-sm font-medium text-slate-700">Featured product</span>
      </label>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
      </Button>
    </form>
  );
}
