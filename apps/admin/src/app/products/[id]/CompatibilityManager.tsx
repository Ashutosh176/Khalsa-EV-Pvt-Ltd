"use client";

import { useEffect, useState } from "react";
import { Button } from "@khalsa-ev/ui";
import { useAuth } from "../../../lib/auth-context";
import {
  addCompatibility,
  createVehicleBrand,
  createVehicleModel,
  createVehicleVariant,
  getProductCompatibility,
  getVehicleBrands,
  getVehicleModels,
  getVehicleVariants,
  removeCompatibility,
} from "../../../lib/api";
import type { CompatibilityEntry, VehicleBrand, VehicleModel, VehicleVariant } from "../../../lib/types";

export function CompatibilityManager({ productId }: { productId: string }) {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<CompatibilityEntry[] | null>(null);

  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reloadEntries() {
    getProductCompatibility(productId)
      .then(setEntries)
      .catch(() => setEntries([]));
  }

  useEffect(() => {
    reloadEntries();
    getVehicleBrands()
      .then(setBrands)
      .catch(() => setBrands([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function handleBrandChange(id: string) {
    setBrandId(id);
    setModelId("");
    setVariantId("");
    setModels([]);
    setVariants([]);
    if (!id) return;
    getVehicleModels(id)
      .then(setModels)
      .catch(() => setModels([]));
  }

  function handleModelChange(id: string) {
    setModelId(id);
    setVariantId("");
    setVariants([]);
    if (!id) return;
    getVehicleVariants(id)
      .then(setVariants)
      .catch(() => setVariants([]));
  }

  async function handleAdd() {
    if (!accessToken || !variantId) return;
    setBusy(true);
    setError(null);
    try {
      await addCompatibility(accessToken, productId, variantId);
      reloadEntries();
      setVariantId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add compatibility");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (!accessToken) return;
    await removeCompatibility(accessToken, id);
    reloadEntries();
  }

  async function handleAddBrand() {
    if (!accessToken) return;
    const name = window.prompt("New vehicle brand name (e.g. Ather)");
    if (!name) return;
    const created = await createVehicleBrand(accessToken, name);
    setBrands((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleAddModel() {
    if (!accessToken || !brandId) return;
    const name = window.prompt("New model name (e.g. 450X)");
    if (!name) return;
    const created = await createVehicleModel(accessToken, brandId, name);
    setModels((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleAddVariant() {
    if (!accessToken || !modelId) return;
    const name = window.prompt("New variant name (e.g. Gen 3)");
    if (!name) return;
    const created = await createVehicleVariant(accessToken, modelId, name);
    setVariants((prev) => [...prev, created]);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">Vehicle compatibility</h2>
      <p className="mt-1 text-sm text-slate-500">Map this part to every vehicle it fits.</p>

      {error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Brand</span>
            <button type="button" onClick={handleAddBrand} className="text-xs font-semibold text-brand-green">
              + New
            </button>
          </div>
          <select
            value={brandId}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Model</span>
            {brandId ? (
              <button type="button" onClick={handleAddModel} className="text-xs font-semibold text-brand-green">
                + New
              </button>
            ) : null}
          </div>
          <select
            value={modelId}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={!brandId}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          >
            <option value="">Select model</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Variant</span>
            {modelId ? (
              <button type="button" onClick={handleAddVariant} className="text-xs font-semibold text-brand-green">
                + New
              </button>
            ) : null}
          </div>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            disabled={!modelId}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          >
            <option value="">Select variant</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button variant="secondary" className="mt-4" onClick={handleAdd} disabled={!variantId || busy}>
        Add mapping
      </Button>

      <div className="mt-6 space-y-2">
        {entries === null ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500">No vehicles mapped yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
              <span>
                {entry.vehicleVariant.model.brand.name} {entry.vehicleVariant.model.name} {entry.vehicleVariant.name}
              </span>
              <button type="button" onClick={() => handleRemove(entry.id)} className="text-slate-400 hover:text-red-500">
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
