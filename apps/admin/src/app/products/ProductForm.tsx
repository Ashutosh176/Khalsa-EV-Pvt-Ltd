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
import type { AdminProduct, BatteryType, Brand, Category, ProductStatus, ProductType, ScooterSpecification } from "../../lib/types";

type Props = {
  mode: "create" | "edit";
  product?: AdminProduct;
};

function paiseToRupeeString(paise: number): string {
  return (paise / 100).toString();
}

// Scooter Specification form state - string-typed so number inputs can hold
// an in-progress/empty value; parsed into ScooterSpecification on submit.
type ScooterSpecForm = {
  brand: string;
  model: string;
  variant: string;
  batteryCapacityAh: string;
  batteryCapacityWh: string;
  batteryType: BatteryType;
  motorPowerW: string;
  topSpeedKmh: string;
  rangeKm: string;
  chargingTimeHours: string;
  brakingType: string;
  tyreType: string;
  tyreSize: string;
  suspension: string;
  kerbWeightKg: string;
  loadCapacityKg: string;
  seatHeightMm: string;
  groundClearanceMm: string;
  warrantyTerms: string;
  highlightFeatures: string; // comma-separated
};

function emptyScooterSpecForm(): ScooterSpecForm {
  return {
    brand: "",
    model: "",
    variant: "",
    batteryCapacityAh: "",
    batteryCapacityWh: "",
    batteryType: "LI_ION",
    motorPowerW: "",
    topSpeedKmh: "",
    rangeKm: "",
    chargingTimeHours: "",
    brakingType: "",
    tyreType: "",
    tyreSize: "",
    suspension: "",
    kerbWeightKg: "",
    loadCapacityKg: "",
    seatHeightMm: "",
    groundClearanceMm: "",
    warrantyTerms: "",
    highlightFeatures: "",
  };
}

function scooterSpecToForm(spec: ScooterSpecification): ScooterSpecForm {
  return {
    brand: spec.brand ?? "",
    model: spec.model,
    variant: spec.variant ?? "",
    batteryCapacityAh: spec.batteryCapacityAh != null ? String(spec.batteryCapacityAh) : "",
    batteryCapacityWh: spec.batteryCapacityWh != null ? String(spec.batteryCapacityWh) : "",
    batteryType: spec.batteryType,
    motorPowerW: String(spec.motorPowerW),
    topSpeedKmh: String(spec.topSpeedKmh),
    rangeKm: String(spec.rangeKm),
    chargingTimeHours: String(spec.chargingTimeHours),
    brakingType: spec.brakingType ?? "",
    tyreType: spec.tyreType ?? "",
    tyreSize: spec.tyreSize ?? "",
    suspension: spec.suspension ?? "",
    kerbWeightKg: spec.kerbWeightKg != null ? String(spec.kerbWeightKg) : "",
    loadCapacityKg: spec.loadCapacityKg != null ? String(spec.loadCapacityKg) : "",
    seatHeightMm: spec.seatHeightMm != null ? String(spec.seatHeightMm) : "",
    groundClearanceMm: spec.groundClearanceMm != null ? String(spec.groundClearanceMm) : "",
    warrantyTerms: spec.warrantyTerms ?? "",
    highlightFeatures: (spec.highlightFeatures ?? []).join(", "),
  };
}

function formToScooterSpec(form: ScooterSpecForm): ScooterSpecification {
  return {
    brand: form.brand || undefined,
    model: form.model,
    variant: form.variant || undefined,
    batteryCapacityAh: form.batteryCapacityAh ? Number(form.batteryCapacityAh) : undefined,
    batteryCapacityWh: form.batteryCapacityWh ? Number(form.batteryCapacityWh) : undefined,
    batteryType: form.batteryType,
    motorPowerW: Math.round(Number(form.motorPowerW)),
    topSpeedKmh: Math.round(Number(form.topSpeedKmh)),
    rangeKm: Math.round(Number(form.rangeKm)),
    chargingTimeHours: Number(form.chargingTimeHours),
    brakingType: form.brakingType || undefined,
    tyreType: form.tyreType || undefined,
    tyreSize: form.tyreSize || undefined,
    suspension: form.suspension || undefined,
    kerbWeightKg: form.kerbWeightKg ? Number(form.kerbWeightKg) : undefined,
    loadCapacityKg: form.loadCapacityKg ? Number(form.loadCapacityKg) : undefined,
    seatHeightMm: form.seatHeightMm ? Math.round(Number(form.seatHeightMm)) : undefined,
    groundClearanceMm: form.groundClearanceMm ? Math.round(Number(form.groundClearanceMm)) : undefined,
    warrantyTerms: form.warrantyTerms || undefined,
    highlightFeatures: form.highlightFeatures
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export function ProductForm({ mode, product }: Props) {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  // Blank until the admin actively picks one (create mode only) - Category
  // and Model only make sense once we know which of the two they apply to.
  const [productType, setProductType] = useState<ProductType | "">(product?.productType ?? "");
  const [scooterSpec, setScooterSpec] = useState<ScooterSpecForm>(
    product?.scooterSpec ? scooterSpecToForm(product.scooterSpec) : emptyScooterSpecForm(),
  );
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

  // Every Scooter product lives under the single "Electric Scooters"
  // category (there's no meaningful choice there), so that field is hidden
  // for Scooters and this id is filled in for them automatically instead.
  const electricScootersCategory = categories.find((c) => c.slug === "electric-scooters");

  function handleProductTypeChange(value: ProductType | "") {
    setProductType(value);
    if (value === "SCOOTER") {
      setCategoryId(electricScootersCategory?.id ?? "");
    } else {
      // Leaving Scooter (or picking a type for the first time) - the
      // auto-filled Electric Scooters category no longer applies.
      setCategoryId((current) => (current === electricScootersCategory?.id ? "" : current));
      setBrandId("");
    }
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
    if (!accessToken || !productType) return;
    setError(null);

    if (productType === "SCOOTER" && !electricScootersCategory) {
      setError('Could not find the "Electric Scooters" category - please refresh and try again.');
      return;
    }
    const categoryIdPayload = productType === "SCOOTER" ? electricScootersCategory!.id : categoryId;
    if (!categoryIdPayload) {
      setError("Please select a category.");
      return;
    }
    if (productType === "SCOOTER" && !brandId) {
      setError("Please select a model.");
      return;
    }

    setSubmitting(true);

    try {
      const priceInPaise = Math.round(Number(priceRupees) * 100);
      const mrpInPaise = Math.round(Number(mrpRupees) * 100);
      const scooterSpecPayload = productType === "SCOOTER" ? formToScooterSpec(scooterSpec) : undefined;
      // Model (brandId) only applies to scooters - don't carry over a
      // leftover selection if the type was switched away from Scooter.
      const brandIdPayload = productType === "SCOOTER" ? brandId : undefined;

      if (mode === "create") {
        const created = await createProduct(accessToken, {
          sku,
          name,
          productType,
          categoryId: categoryIdPayload,
          brandId: brandIdPayload,
          partNumber: partNumber || undefined,
          description: description || undefined,
          price: priceInPaise,
          mrp: mrpInPaise,
          gstPercent: gstPercent ? Number(gstPercent) : undefined,
          warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
          status,
          isFeatured,
          initialStock: initialStock ? Number(initialStock) : undefined,
          scooterSpec: scooterSpecPayload,
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
          productType,
          categoryId: categoryIdPayload,
          brandId: brandIdPayload,
          partNumber: partNumber || undefined,
          description: description || undefined,
          price: priceInPaise,
          mrp: mrpInPaise,
          gstPercent: gstPercent ? Number(gstPercent) : undefined,
          warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
          status,
          isFeatured,
          scooterSpec: scooterSpecPayload,
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
          <span className="text-sm font-medium text-slate-700">Product type</span>
          <select
            required
            value={productType}
            onChange={(e) => handleProductTypeChange(e.target.value as ProductType | "")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="" disabled>
              Select product type
            </option>
            <option value="SPARE_PART">Spare Part</option>
            <option value="SCOOTER">Electric Scooter</option>
          </select>
        </label>

        {productType && productType !== "SCOOTER" ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            >
              <option value="">Select category</option>
              {categories
                .filter((category) => category.slug !== "electric-scooters")
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
        ) : null}

        {productType === "SCOOTER" ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Model</span>
            <select
              required
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            >
              <option value="">Select model</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

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

      {productType === "SCOOTER" ? <ScooterSpecFields value={scooterSpec} onChange={setScooterSpec} /> : null}

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

const specInputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green";

function ScooterSpecFields({ value, onChange }: { value: ScooterSpecForm; onChange: (next: ScooterSpecForm) => void }) {
  function set<K extends keyof ScooterSpecForm>(key: K, fieldValue: ScooterSpecForm[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">Scooter specifications</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Model</span>
          <input required value={value.model} onChange={(e) => set("model", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Variant (optional)</span>
          <input value={value.variant} onChange={(e) => set("variant", e.target.value)} className={specInputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Battery type</span>
          <select value={value.batteryType} onChange={(e) => set("batteryType", e.target.value as BatteryType)} className={specInputClass}>
            <option value="LI_ION">Li-ion</option>
            <option value="LFP">LFP</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Battery capacity (Ah, optional)</span>
          <input type="number" min="0" step="0.1" value={value.batteryCapacityAh} onChange={(e) => set("batteryCapacityAh", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Battery capacity (Wh, optional)</span>
          <input type="number" min="0" step="0.1" value={value.batteryCapacityWh} onChange={(e) => set("batteryCapacityWh", e.target.value)} className={specInputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Motor power (W)</span>
          <input required type="number" min="0" value={value.motorPowerW} onChange={(e) => set("motorPowerW", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Top speed (km/h)</span>
          <input required type="number" min="0" value={value.topSpeedKmh} onChange={(e) => set("topSpeedKmh", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Range (km)</span>
          <input required type="number" min="0" value={value.rangeKm} onChange={(e) => set("rangeKm", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Charging time (hours)</span>
          <input required type="number" min="0" step="0.1" value={value.chargingTimeHours} onChange={(e) => set("chargingTimeHours", e.target.value)} className={specInputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Braking type (optional)</span>
          <input value={value.brakingType} onChange={(e) => set("brakingType", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tyre type (optional)</span>
          <input value={value.tyreType} onChange={(e) => set("tyreType", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tyre size (optional)</span>
          <input value={value.tyreSize} onChange={(e) => set("tyreSize", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Suspension (optional)</span>
          <input value={value.suspension} onChange={(e) => set("suspension", e.target.value)} className={specInputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Kerb weight (kg, optional)</span>
          <input type="number" min="0" step="0.1" value={value.kerbWeightKg} onChange={(e) => set("kerbWeightKg", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Load capacity (kg, optional)</span>
          <input type="number" min="0" step="0.1" value={value.loadCapacityKg} onChange={(e) => set("loadCapacityKg", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Seat height (mm, optional)</span>
          <input type="number" min="0" value={value.seatHeightMm} onChange={(e) => set("seatHeightMm", e.target.value)} className={specInputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ground clearance (mm, optional)</span>
          <input type="number" min="0" value={value.groundClearanceMm} onChange={(e) => set("groundClearanceMm", e.target.value)} className={specInputClass} />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-700">Warranty terms (optional)</span>
        <input value={value.warrantyTerms} onChange={(e) => set("warrantyTerms", e.target.value)} className={specInputClass} />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-700">Highlight features (comma-separated, optional)</span>
        <input
          value={value.highlightFeatures}
          onChange={(e) => set("highlightFeatures", e.target.value)}
          placeholder="Digital Display, Reverse Mode, USB Charging Port"
          className={specInputClass}
        />
      </label>
    </fieldset>
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
