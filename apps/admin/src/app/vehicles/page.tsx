"use client";

import { useEffect, useState } from "react";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { useAuth } from "../../lib/auth-context";
import {
  createVehicleBrand,
  createVehicleModel,
  createVehicleVariant,
  getVehicleBrands,
  getVehicleModels,
  getVehicleVariants,
} from "../../lib/api";
import type { VehicleBrand, VehicleModel, VehicleVariant } from "../../lib/types";

function Column({
  title,
  items,
  selectedId,
  onSelect,
  onAdd,
  emptyHint,
  disabled,
}: {
  title: string;
  items: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  emptyHint: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">{title}</h2>
        <Button variant="ghost" onClick={onAdd} disabled={disabled}>
          + Add
        </Button>
      </div>
      <div className="mt-3 space-y-1">
        {items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-400">{emptyHint}</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                item.id === selectedId ? "bg-brand-green/10 font-semibold text-brand-green" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function VehiclesContent() {
  const { accessToken } = useAuth();
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    getVehicleBrands()
      .then(setBrands)
      .catch(() => setBrands([]));
  }, []);

  function selectBrand(id: string) {
    setBrandId(id);
    setModelId("");
    setModels([]);
    setVariants([]);
    getVehicleModels(id)
      .then(setModels)
      .catch(() => setModels([]));
  }

  function selectModel(id: string) {
    setModelId(id);
    setVariants([]);
    getVehicleVariants(id)
      .then(setVariants)
      .catch(() => setVariants([]));
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Vehicles</h1>
      <p className="mt-1 text-slate-500">
        Manage the brand → model → variant hierarchy used for spare-part compatibility mapping.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Column
          title="Brand"
          items={brands}
          selectedId={brandId}
          onSelect={selectBrand}
          onAdd={handleAddBrand}
          emptyHint="No vehicle brands yet."
        />
        <Column
          title="Model"
          items={models}
          selectedId={modelId}
          onSelect={selectModel}
          onAdd={handleAddModel}
          emptyHint={brandId ? "No models for this brand yet." : "Select a brand first."}
          disabled={!brandId}
        />
        <Column
          title="Variant"
          items={variants}
          selectedId=""
          onSelect={() => undefined}
          onAdd={handleAddVariant}
          emptyHint={modelId ? "No variants for this model yet." : "Select a model first."}
          disabled={!modelId}
        />
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <AdminShell>
      <VehiclesContent />
    </AdminShell>
  );
}
