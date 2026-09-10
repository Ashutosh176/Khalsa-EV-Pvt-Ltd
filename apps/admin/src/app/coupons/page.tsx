"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatIndianRupees } from "@khalsa-ev/utils";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { archiveCoupon, createCoupon, getAdminCoupons, updateCoupon } from "../../lib/api";
import type { AdminCoupon, CouponType, CreateCouponInput } from "../../lib/types";

function paiseToRupeeString(paise: number | null): string {
  return paise == null ? "" : (paise / 100).toString();
}

function rupeesToPaise(rupees: string): number | undefined {
  if (rupees.trim() === "") return undefined;
  return Math.round(Number(rupees) * 100);
}

type FormState = {
  code: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
};

const EMPTY_FORM: FormState = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
};

function couponToForm(coupon: AdminCoupon): FormState {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.type === "PERCENTAGE" ? String(coupon.value) : paiseToRupeeString(coupon.value),
    minOrderAmount: paiseToRupeeString(coupon.minOrderAmount) || "0",
    maxDiscountAmount: paiseToRupeeString(coupon.maxDiscountAmount),
    usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
    startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : "",
    endsAt: coupon.endsAt ? coupon.endsAt.slice(0, 10) : "",
  };
}

function formToDto(form: FormState): CreateCouponInput {
  return {
    code: form.code.trim(),
    type: form.type,
    value: form.type === "PERCENTAGE" ? Number(form.value) : (rupeesToPaise(form.value) ?? 0),
    minOrderAmount: rupeesToPaise(form.minOrderAmount) ?? 0,
    maxDiscountAmount: form.type === "PERCENTAGE" ? rupeesToPaise(form.maxDiscountAmount) : undefined,
    usageLimit: form.usageLimit.trim() === "" ? undefined : Number(form.usageLimit),
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
  };
}

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

function CouponForm({
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

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Code</span>
          <input
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. WELCOME10"
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Type</span>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CouponType }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          >
            <option value="PERCENTAGE">Percentage off</option>
            <option value="FLAT">Flat amount off</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">{form.type === "PERCENTAGE" ? "Percent off" : "Amount off (Rs.)"}</span>
          <input
            required
            type="number"
            min={1}
            max={form.type === "PERCENTAGE" ? 100 : undefined}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Minimum order (Rs.)</span>
          <input
            type="number"
            min={0}
            value={form.minOrderAmount}
            onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>

        {form.type === "PERCENTAGE" ? (
          <label className="block">
            <span className="text-xs font-medium text-brand-sub">Max discount (Rs., optional)</span>
            <input
              type="number"
              min={1}
              value={form.maxDiscountAmount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
              className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Usage limit (optional)</span>
          <input
            type="number"
            min={1}
            value={form.usageLimit}
            onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
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
          {submitting ? "Saving..." : isEditing ? "Save changes" : "Create coupon"}
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

function CouponsContent() {
  const { accessToken } = useAuth();
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  function reload() {
    if (!accessToken) return;
    getAdminCoupons(accessToken)
      .then(setCoupons)
      .catch(() => setCoupons([]));
  }

  useEffect(reload, [accessToken]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setAddError(null);
    setSubmitting(true);
    try {
      const created = await createCoupon(accessToken, formToDto(addForm));
      setCoupons((prev) => [created, ...(prev ?? [])]);
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not create coupon");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(coupon: AdminCoupon) {
    setEditingId(coupon.id);
    setEditForm(couponToForm(coupon));
    setEditError(null);
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !editingId) return;
    setEditError(null);
    setSubmitting(true);
    try {
      const updated = await updateCoupon(accessToken, editingId, formToDto(editForm));
      setCoupons((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not save coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(coupon: AdminCoupon) {
    if (!accessToken) return;
    try {
      const updated = coupon.isActive
        ? await archiveCoupon(accessToken, coupon.id)
        : await updateCoupon(accessToken, coupon.id, { isActive: true });
      setCoupons((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      // Surfaced via the row simply not changing; the list stays in its last-known-good state.
    }
  }

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[23px] font-bold">Coupons</h1>
            <p className="mt-0.5 text-[13px] text-brand-sub">Discount codes customers can apply at checkout.</p>
          </div>
          {!showAddForm ? <Button onClick={() => setShowAddForm(true)}>+ Add coupon</Button> : null}
        </div>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          {showAddForm ? (
            <CouponForm
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
                <th className="px-4 py-2.5 font-semibold">Code</th>
                <th className="px-4 py-2.5 font-semibold">Discount</th>
                <th className="px-4 py-2.5 font-semibold">Min order</th>
                <th className="px-4 py-2.5 font-semibold">Usage</th>
                <th className="px-4 py-2.5 font-semibold">Valid until</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons === null ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-brand-sub">
                    No coupons yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) =>
                  editingId === coupon.id ? (
                    <tr key={coupon.id}>
                      <td colSpan={7} className="p-0">
                        <CouponForm
                          form={editForm}
                          setForm={setEditForm}
                          onSubmit={handleSaveEdit}
                          onCancel={() => setEditingId(null)}
                          submitting={submitting}
                          error={editError}
                          isEditing
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={coupon.id} className="border-t border-[#EFF0F1]">
                      <td className="px-4 py-2.5 font-bold">{coupon.code}</td>
                      <td className="px-4 py-2.5">
                        {coupon.type === "PERCENTAGE" ? `${coupon.value}% off` : `${formatIndianRupees(coupon.value)} off`}
                        {coupon.type === "PERCENTAGE" && coupon.maxDiscountAmount != null
                          ? ` (max ${formatIndianRupees(coupon.maxDiscountAmount)})`
                          : ""}
                      </td>
                      <td className="px-4 py-2.5 text-brand-sub">
                        {coupon.minOrderAmount > 0 ? formatIndianRupees(coupon.minOrderAmount) : "None"}
                      </td>
                      <td className="px-4 py-2.5 text-brand-sub">
                        {coupon.usedCount}
                        {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""}
                      </td>
                      <td className="px-4 py-2.5 text-brand-sub">
                        {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString("en-IN") : "No expiry"}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge isActive={coupon.isActive} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-3">
                          <button type="button" onClick={() => startEdit(coupon)} className="font-semibold text-brand-green-dark">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(coupon)}
                            className={coupon.isActive ? "font-semibold text-brand-red" : "font-semibold text-brand-green-dark"}
                          >
                            {coupon.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <AdminShell>
      <CouponsContent />
    </AdminShell>
  );
}
