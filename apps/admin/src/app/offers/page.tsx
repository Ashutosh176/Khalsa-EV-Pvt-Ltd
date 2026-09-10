"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { createOffer, deleteOffer, getAdminOffers, updateOffer, uploadOfferImage } from "../../lib/api";
import type { AdminOffer } from "../../lib/types";

type FormState = { title: string; description: string; startsAt: string; endsAt: string };
const EMPTY_FORM: FormState = { title: "", description: "", startsAt: "", endsAt: "" };

function offerToForm(offer: AdminOffer): FormState {
  return {
    title: offer.title,
    description: offer.description ?? "",
    startsAt: offer.startsAt ? offer.startsAt.slice(0, 10) : "",
    endsAt: offer.endsAt ? offer.endsAt.slice(0, 10) : "",
  };
}

function formToDto(form: FormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
  };
}

function StatusBadge({ offer }: { offer: AdminOffer }) {
  // A snapshot taken once at mount, not read live on every render - this
  // badge doesn't need to flip the instant an offer's window closes, and
  // calling Date.now() directly in the render body is impure (see
  // PhoneOtpVerifier's identical useState(() => Date.now()) pattern).
  const [now] = useState(() => Date.now());
  const notStarted = offer.startsAt && new Date(offer.startsAt).getTime() > now;
  const ended = offer.endsAt && new Date(offer.endsAt).getTime() < now;
  const label = !offer.isActive ? "INACTIVE" : ended ? "ENDED" : notStarted ? "SCHEDULED" : "LIVE";
  const style =
    label === "LIVE"
      ? "bg-[#E8F7EA] text-[#1F8A3B]"
      : label === "SCHEDULED"
        ? "bg-[#E7F0FE] text-[#2563C6]"
        : "bg-slate-100 text-slate-500";
  return <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${style}`}>{label}</span>;
}

function OfferForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  error,
  isEditing,
}: {
  form: FormState;
  setForm: (updater: (prev: FormState) => FormState) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: (() => void) | null;
  submitting: boolean;
  error: string | null;
  isEditing: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 border-b border-brand-line p-3.5">
      {error ? <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Festive Sale - Flat 20% Off"
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Description (optional)</span>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Starts (optional)</span>
          <input
            type="date"
            value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Ends (optional)</span>
          <input
            type="date"
            value={form.endsAt}
            onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEditing ? "Save changes" : "Create offer"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function OfferRow({ offer, onChanged }: { offer: AdminOffer; onChanged: (updated: AdminOffer | null) => void }) {
  const { accessToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => offerToForm(offer));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const updated = await updateOffer(accessToken, offer.id, formToDto(form));
      onChanged(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save offer");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!accessToken) return;
    const updated = await updateOffer(accessToken, offer.id, { isActive: !offer.isActive });
    onChanged(updated);
  }

  async function handleDelete() {
    if (!accessToken) return;
    await deleteOffer(accessToken, offer.id);
    onChanged(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!accessToken || !file) return;
    try {
      const updated = await uploadOfferImage(accessToken, offer.id, file);
      onChanged(updated);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={5} className="p-0">
          <OfferForm form={form} setForm={setForm} onSubmit={handleSaveEdit} onCancel={() => setEditing(false)} submitting={submitting} error={error} isEditing />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-[#EFF0F1]">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-brand-line bg-brand-surface">
            {offer.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, non-Next-optimized asset
              <img src={offer.imageUrl} alt={offer.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-brand-sub">No image</span>
            )}
          </div>
          <div>
            <b className="block">{offer.title}</b>
            {offer.description ? <span className="text-[11px] text-brand-sub">{offer.description}</span> : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-brand-sub">
        {offer.startsAt ? new Date(offer.startsAt).toLocaleDateString("en-IN") : "Any time"}
        {" – "}
        {offer.endsAt ? new Date(offer.endsAt).toLocaleDateString("en-IN") : "No end"}
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge offer={offer} />
      </td>
      <td className="px-4 py-2.5">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id={`offer-image-${offer.id}`} />
        <label htmlFor={`offer-image-${offer.id}`} className="cursor-pointer font-semibold text-brand-green-dark">
          {offer.imageUrl ? "Change image" : "Upload image"}
        </label>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing(true)} className="font-semibold text-brand-green-dark">
            Edit
          </button>
          <button type="button" onClick={handleToggleActive} className={offer.isActive ? "font-semibold text-brand-red" : "font-semibold text-brand-green-dark"}>
            {offer.isActive ? "Deactivate" : "Reactivate"}
          </button>
          <button type="button" onClick={handleDelete} className="font-semibold text-brand-red">
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function OffersContent() {
  const { accessToken } = useAuth();
  const [offers, setOffers] = useState<AdminOffer[] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    if (!accessToken) return;
    getAdminOffers(accessToken)
      .then(setOffers)
      .catch(() => setOffers([]));
  }

  useEffect(reload, [accessToken]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setAddError(null);
    setSubmitting(true);
    try {
      const created = await createOffer(accessToken, formToDto(addForm));
      setOffers((prev) => [created, ...(prev ?? [])]);
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not create offer");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRowChanged(offerId: string, updated: AdminOffer | null) {
    setOffers((prev) => (updated ? (prev ?? []).map((o) => (o.id === offerId ? updated : o)) : (prev ?? []).filter((o) => o.id !== offerId)));
  }

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[23px] font-bold">Offers</h1>
            <p className="mt-0.5 text-[13px] text-brand-sub">Promotional banners shown on the storefront homepage.</p>
          </div>
          {!showAddForm ? <Button onClick={() => setShowAddForm(true)}>+ Add offer</Button> : null}
        </div>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          {showAddForm ? (
            <OfferForm
              form={addForm}
              setForm={setAddForm}
              onSubmit={handleCreate}
              onCancel={() => {
                setShowAddForm(false);
                setAddError(null);
              }}
              submitting={submitting}
              error={addError}
              isEditing={false}
            />
          ) : null}

          <table className="dt w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                <th className="px-4 py-2.5 font-semibold">Offer</th>
                <th className="px-4 py-2.5 font-semibold">Valid</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Image</th>
                <th className="px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers === null ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    No offers yet.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <OfferRow key={offer.id} offer={offer} onChanged={(updated) => handleRowChanged(offer.id, updated)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  return (
    <AdminShell>
      <OffersContent />
    </AdminShell>
  );
}
