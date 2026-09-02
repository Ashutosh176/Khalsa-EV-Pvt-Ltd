"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@khalsa-ev/ui";
import type { Address, AddressInput } from "@khalsa-ev/types";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { AccountNav } from "../../../components/AccountNav";
import { useAuth } from "../../../lib/auth-context";
import { createAddress, deleteAddress, getAddresses, updateAddress } from "../../../lib/api";

const EMPTY_FORM: AddressInput = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
};

export default function AddressesPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [addressesState, setAddresses] = useState<Address[] | null>(null);
  const addresses = accessToken ? addressesState : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getAddresses(accessToken)
      .then((result) => {
        if (!cancelled) setAddresses(result);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAddress(accessToken, editingId, form);
        setAddresses((prev) => (prev ?? []).map((a) => (a.id === editingId ? updated : { ...a, isDefault: form.isDefault ? false : a.isDefault })));
      } else {
        const created = await createAddress(accessToken, form);
        setAddresses((prev) => [...(prev ?? []).map((a) => (form.isDefault ? { ...a, isDefault: false } : a)), created]);
      }
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    await deleteAddress(accessToken, id);
    setAddresses((prev) => (prev ?? []).filter((a) => a.id !== id));
  }

  async function handleSetDefault(address: Address) {
    if (!accessToken) return;
    const updated = await updateAddress(accessToken, address.id, { isDefault: true });
    setAddresses((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : { ...a, isDefault: false })));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">My account</h1>

        {!authLoading && !user ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-600">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green">
              Log in
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
            <AccountNav />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-ink">Addresses</h2>
                <Button onClick={startCreate}>Add address</Button>
              </div>

              {showForm ? (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
                  {error ? (
                    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Full name</span>
                      <input
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Phone</span>
                      <input
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Address line 1</span>
                    <input
                      required
                      value={form.line1}
                      onChange={(e) => setForm({ ...form, line1: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Address line 2 (optional)</span>
                    <input
                      value={form.line2}
                      onChange={(e) => setForm({ ...form, line2: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">City</span>
                      <input
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">State</span>
                      <input
                        required
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Postal code</span>
                      <input
                        required
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isDefault ?? false}
                      onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    />
                    Set as default address
                  </label>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : editingId ? "Save changes" : "Add address"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}

              {addresses === null ? (
                <p className="text-sm text-slate-500">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <p className="text-slate-600">You haven&apos;t saved any addresses yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <div key={address.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-brand-ink">{address.fullName}</p>
                          <p className="text-sm text-slate-500">{address.phone}</p>
                        </div>
                        {address.isDefault ? (
                          <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                        <button type="button" onClick={() => startEdit(address)} className="text-brand-green">
                          Edit
                        </button>
                        {!address.isDefault ? (
                          <button type="button" onClick={() => handleSetDefault(address)} className="text-slate-600">
                            Set as default
                          </button>
                        ) : null}
                        <button type="button" onClick={() => handleDelete(address.id)} className="text-red-500">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
