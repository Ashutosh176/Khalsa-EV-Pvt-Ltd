"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import { useAuth } from "../../lib/auth-context";
import {
  createProduct,
  deleteProductImage,
  getBrands,
  getCategories,
  updateProduct,
  uploadProductImages,
} from "../../lib/api";
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

  // Edit mode: images already exist server-side and upload immediately.
  // Create mode: there's no product id yet to attach an image to, so
  // picked files are held here (with local object-URL previews) and
  // only actually uploaded once handleSubmit's createProduct succeeds.
  const [images, setImages] = useState(product?.images ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // lets picking the same file again re-fire onChange
    if (files.length === 0) return;

    if (mode === "create") {
      setPendingFiles((prev) => [...prev, ...files]);
      return;
    }
    void uploadNow(files);
  }

  async function uploadNow(files: File[]) {
    if (!accessToken || !product) return;
    setImageError(null);
    setUploadingImages(true);
    try {
      const updated = await uploadProductImages(accessToken, product.id, files);
      setImages(updated.images);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Image upload failed. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageDelete(imageId: string) {
    if (!accessToken || !product) return;
    setImageError(null);
    try {
      const updated = await deleteProductImage(accessToken, product.id, imageId);
      setImages(updated.images);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Could not delete image. Please try again.");
    }
  }

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
        // Best-effort: the product itself is already saved at this point,
        // so a failed image upload shouldn't block navigation - the edit
        // page they land on has the same upload control to retry from.
        if (pendingFiles.length > 0) {
          await uploadProductImages(accessToken, created.id, pendingFiles).catch(() => undefined);
        }
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

      <div>
        <span className="text-sm font-medium text-slate-700">Product images</span>
        {mode === "create" ? (
          <p className="mt-0.5 text-xs text-slate-400">Uploaded once you create the product below.</p>
        ) : null}

        {imageError ? (
          <p className="mt-1.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {imageError}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((image) => (
            <div key={image.id} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- external/dev-local origin, not under next/image's optimizer */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => void handleImageDelete(image.id)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}

          {pendingFiles.map((file, index) => (
            <PendingImagePreview key={`${file.name}-${index}`} file={file} onRemove={() => removePendingFile(index)} />
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImages}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-brand-green hover:text-brand-green disabled:opacity-50"
          >
            {uploadingImages ? "Uploading..." : "+ Add image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

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

// Local-only preview for a not-yet-uploaded File (create mode, before the
// product - and therefore an id to attach images to - exists). The object
// URL is revoked on unmount/file-change so it doesn't leak.
function PendingImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: URL, not under next/image's optimizer
        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
