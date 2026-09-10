"use client";

import { useEffect, useState } from "react";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import {
  archiveBrand,
  archiveCategory,
  createBrand,
  createCategory,
  getAdminBrands,
  getAdminCategories,
  updateBrand,
  updateCategory,
} from "../../lib/api";
import type { AdminBrand, AdminCategory } from "../../lib/types";

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
        isActive ? "bg-[#E8F7EA] text-[#1F8A3B]" : "bg-slate-100 text-slate-500"
      }`}
    >
      {isActive ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

function CategoriesTab() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    if (!accessToken) return;
    getAdminCategories(accessToken)
      .then(setCategories)
      .catch(() => setCategories([]));
  }

  useEffect(reload, [accessToken]);

  async function handleAdd() {
    if (!accessToken) return;
    const name = window.prompt("New category name (e.g. Batteries & Chargers)");
    if (!name) return;
    setError(null);
    try {
      const created = await createCategory(accessToken, { name });
      setCategories((prev) => [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category");
    }
  }

  async function handleRename(category: AdminCategory) {
    if (!accessToken) return;
    const name = window.prompt("Rename category", category.name);
    if (!name || name === category.name) return;
    setError(null);
    try {
      const updated = await updateCategory(accessToken, category.id, { name });
      setCategories((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename category");
    }
  }

  async function handleToggleActive(category: AdminCategory) {
    if (!accessToken) return;
    setError(null);
    try {
      const updated = category.isActive
        ? await archiveCategory(accessToken, category.id)
        : await updateCategory(accessToken, category.id, { isActive: true });
      setCategories((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update category");
    }
  }

  return (
    <div className="rounded-[10px] border border-brand-line bg-white">
      <div className="flex items-center justify-between border-b border-brand-line p-3.5">
        <p className="text-[12.5px] text-brand-sub">Categories shown to customers on the storefront.</p>
        <Button onClick={handleAdd}>+ Add category</Button>
      </div>

      {error ? <p className="mx-3.5 mt-3.5 rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red">{error}</p> : null}

      <table className="dt w-full text-left text-[12.5px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
            <th className="px-4 py-2.5 font-semibold">Name</th>
            <th className="px-4 py-2.5 font-semibold">Slug</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories === null ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-brand-sub">
                Loading...
              </td>
            </tr>
          ) : categories.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-brand-sub">
                No categories yet.
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category.id} className="border-t border-[#EFF0F1]">
                <td className="px-4 py-2.5 font-bold">{category.name}</td>
                <td className="px-4 py-2.5 text-brand-sub">{category.slug}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge isActive={category.isActive} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleRename(category)} className="font-semibold text-brand-green-dark">
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(category)}
                      className={category.isActive ? "font-semibold text-brand-red" : "font-semibold text-brand-green-dark"}
                    >
                      {category.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function BrandsTab() {
  const { accessToken } = useAuth();
  const [brands, setBrands] = useState<AdminBrand[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    if (!accessToken) return;
    getAdminBrands(accessToken)
      .then(setBrands)
      .catch(() => setBrands([]));
  }

  useEffect(reload, [accessToken]);

  async function handleAdd() {
    if (!accessToken) return;
    const name = window.prompt("New brand name (e.g. Ather Energy)");
    if (!name) return;
    setError(null);
    try {
      const created = await createBrand(accessToken, { name });
      setBrands((prev) => [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create brand");
    }
  }

  async function handleRename(brand: AdminBrand) {
    if (!accessToken) return;
    const name = window.prompt("Rename brand", brand.name);
    if (!name || name === brand.name) return;
    setError(null);
    try {
      const updated = await updateBrand(accessToken, brand.id, { name });
      setBrands((prev) => (prev ?? []).map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename brand");
    }
  }

  async function handleToggleActive(brand: AdminBrand) {
    if (!accessToken) return;
    setError(null);
    try {
      const updated = brand.isActive
        ? await archiveBrand(accessToken, brand.id)
        : await updateBrand(accessToken, brand.id, { isActive: true });
      setBrands((prev) => (prev ?? []).map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update brand");
    }
  }

  return (
    <div className="rounded-[10px] border border-brand-line bg-white">
      <div className="flex items-center justify-between border-b border-brand-line p-3.5">
        <p className="text-[12.5px] text-brand-sub">Brands shown in product filters and the product form.</p>
        <Button onClick={handleAdd}>+ Add brand</Button>
      </div>

      {error ? <p className="mx-3.5 mt-3.5 rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red">{error}</p> : null}

      <table className="dt w-full text-left text-[12.5px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
            <th className="px-4 py-2.5 font-semibold">Name</th>
            <th className="px-4 py-2.5 font-semibold">Slug</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {brands === null ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-brand-sub">
                Loading...
              </td>
            </tr>
          ) : brands.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-brand-sub">
                No brands yet.
              </td>
            </tr>
          ) : (
            brands.map((brand) => (
              <tr key={brand.id} className="border-t border-[#EFF0F1]">
                <td className="px-4 py-2.5 font-bold">{brand.name}</td>
                <td className="px-4 py-2.5 text-brand-sub">{brand.slug}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge isActive={brand.isActive} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleRename(brand)} className="font-semibold text-brand-green-dark">
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(brand)}
                      className={brand.isActive ? "font-semibold text-brand-red" : "font-semibold text-brand-green-dark"}
                    >
                      {brand.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesContent() {
  const [tab, setTab] = useState<"categories" | "brands">("categories");

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <h1 className="text-[23px] font-bold">Categories & Brands</h1>
        <p className="mt-0.5 text-[13px] text-brand-sub">Manage the taxonomy products are organized under.</p>

        <div className="mt-4 flex gap-4 border-b border-brand-line text-[12.5px] font-semibold text-brand-sub">
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={`pb-2.5 ${tab === "categories" ? "border-b-2 border-brand-green-dark text-brand-green-dark" : ""}`}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => setTab("brands")}
            className={`pb-2.5 ${tab === "brands" ? "border-b-2 border-brand-green-dark text-brand-green-dark" : ""}`}
          >
            Brands
          </button>
        </div>

        <div className="mt-4">{tab === "categories" ? <CategoriesTab /> : <BrandsTab />}</div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <AdminShell>
      <CategoriesContent />
    </AdminShell>
  );
}
