"use client";

import { useEffect, useState } from "react";
import { CatalogProductCard } from "@khalsa-ev/ui";
import type { CatalogProduct, VehicleBrand, VehicleModel, VehicleVariant } from "@khalsa-ev/types";
import { getCatalogProducts, getVehicleBrands, getVehicleModels, getVehicleVariants } from "../../lib/api";

export function FindPartsFinder() {
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    getVehicleBrands()
      .then(setBrands)
      .catch(() => setBrands([]));
  }, []);

  function handleBrandChange(nextBrandId: string) {
    setBrandId(nextBrandId);
    setModelId("");
    setModels([]);
    setVariantId("");
    setVariants([]);
    setProducts(null);
    if (!nextBrandId) return;
    getVehicleModels(nextBrandId)
      .then(setModels)
      .catch(() => setModels([]));
  }

  function handleModelChange(nextModelId: string) {
    setModelId(nextModelId);
    setVariantId("");
    setVariants([]);
    setProducts(null);
    if (!nextModelId) return;
    getVehicleVariants(nextModelId)
      .then(setVariants)
      .catch(() => setVariants([]));
  }

  function handleVariantChange(nextVariantId: string) {
    setVariantId(nextVariantId);
    setProducts(null);
    if (!nextVariantId) return;
    setLoadingProducts(true);
    getCatalogProducts({ vehicleVariantId: nextVariantId, pageSize: 50 })
      .then((result) => setProducts(result.items))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }

  return (
    <div className="mt-8">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Brand</span>
          <select
            value={brandId}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Model</span>
          <select
            value={modelId}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={!brandId}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">{brandId ? "Select model" : "Select a brand first"}</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Variant</span>
          <select
            value={variantId}
            onChange={(e) => handleVariantChange(e.target.value)}
            disabled={!modelId}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">{modelId ? "Select variant" : "Select a model first"}</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8">
        {loadingProducts ? <p className="text-sm text-slate-500">Searching compatible parts...</p> : null}

        {!loadingProducts && products !== null && products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No compatible parts found for this vehicle yet.
          </div>
        ) : null}

        {!loadingProducts && products && products.length > 0 ? (
          <>
            <p className="text-sm text-slate-500">
              {products.length} compatible {products.length === 1 ? "part" : "parts"} found
            </p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <CatalogProductCard
                  key={product.id}
                  slug={product.slug}
                  name={product.name}
                  sku={product.sku}
                  price={product.price}
                  mrp={product.mrp}
                  inStock={product.inStock}
                  imageUrl={product.images[0]?.url}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
