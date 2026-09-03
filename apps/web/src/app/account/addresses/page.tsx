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
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {!authLoading && !user ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-green-dark">
              Log in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <AccountNav />

            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-[18px] font-bold">Addresses</h1>
                <Button onClick={startCreate}>Add address</Button>
              </div>

              {showForm ? (
                <form onSubmit={handleSubmit} className="space-y-3.5 rounded-[10px] border border-brand-line p-4">
                  {error ? (
                    <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[12.5px] font-medium text-brand-sub">Full name</span>
                      <input
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[12.5px] font-medium text-brand-sub">Phone</span>
                      <input
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[12.5px] font-medium text-brand-sub">Address line 1</span>
                    <input
                      required
                      value={form.line1}
                      onChange={(e) => setForm({ ...form, line1: e.target.value })}
                      className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[12.5px] font-medium text-brand-sub">Address line 2 (optional)</span>
                    <input
                      value={form.line2}
                      onChange={(e) => setForm({ ...form, line2: e.target.value })}
                      className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
                    />
                  </label>

                  <div className="grid gap-3.5 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-[12.5px] font-medium text-brand-sub">City</span>
                      <input
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[12.5px] font-medium text-brand-sub">State</span>
                      <input
                        required
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[12.5px] font-medium text-brand-sub">Postal code</span>
                      <input
                        required
                        value={form.postalCode}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-[12.5px] text-brand-sub">
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
                <p className="text-sm text-brand-sub">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
                  <p className="text-brand-sub">You haven&apos;t saved any addresses yet.</p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {addresses.map((address) => (
                    <div key={address.id} className="rounded-[10px] border border-brand-line p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13.5px] font-bold">{address.fullName}</p>
                          <p className="text-[12.5px] text-brand-sub">{address.phone}</p>
                        </div>
                        {address.isDefault ? (
                          <span className="rounded-[4px] bg-brand-green-light px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-green-dark">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2.5 text-[12.5px] text-brand-sub">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3.5 text-[12px] font-semibold">
                        <button type="button" onClick={() => startEdit(address)} className="text-brand-green-dark">
                          Edit
                        </button>
                        {!address.isDefault ? (
                          <button type="button" onClick={() => handleSetDefault(address)} className="text-brand-sub">
                            Set as default
                          </button>
                        ) : null}
                        <button type="button" onClick={() => handleDelete(address.id)} className="text-brand-red">
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
