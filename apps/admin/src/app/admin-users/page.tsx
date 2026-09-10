"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@khalsa-ev/ui";
import { AdminShell } from "../../components/AdminShell";
import { AdminTopbar } from "../../components/AdminTopbar";
import { useAuth } from "../../lib/auth-context";
import { createAdminUser, getAdminUsers, updateAdminUser } from "../../lib/api";
import type { AdminUserRow, Role } from "../../lib/types";

const ROLES: Role[] = ["SUPER_ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER", "INVENTORY_MANAGER", "SUPPORT_MANAGER"];

type AddFormState = { email: string; password: string; name: string; role: Role };
const EMPTY_ADD_FORM: AddFormState = { email: "", password: "", name: "", role: "SUPPORT_MANAGER" };

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
        isActive ? "bg-[#E8F7EA] text-[#1F8A3B]" : "bg-slate-100 text-slate-500"
      }`}
    >
      {isActive ? "ACTIVE" : "DEACTIVATED"}
    </span>
  );
}

function AdminUserRowView({
  row,
  isSelf,
  onChanged,
}: {
  row: AdminUserRow;
  isSelf: boolean;
  onChanged: (updated: AdminUserRow) => void;
}) {
  const { accessToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const [role, setRole] = useState<Role>(row.role);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const updated = await updateAdminUser(accessToken, row.id, { name, role: isSelf ? undefined : role });
      onChanged(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!accessToken || isSelf) return;
    const updated = await updateAdminUser(accessToken, row.id, { isActive: !row.isActive });
    onChanged(updated);
  }

  if (editing) {
    return (
      <tr className="border-t border-[#EFF0F1]">
        <td colSpan={5} className="px-4 py-3">
          <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
            {error ? <p className="w-full rounded-[7px] bg-red-50 px-4 py-2 text-[12.5px] text-brand-red">{error}</p> : null}
            <label className="block">
              <span className="text-xs font-medium text-brand-sub">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-brand-sub">Role{isSelf ? " (can't change your own)" : ""}</span>
              <select
                value={role}
                disabled={isSelf}
                onChange={(e) => setRole(e.target.value as Role)}
                className="mt-1 block rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green disabled:bg-brand-surface"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-[#EFF0F1]">
      <td className="px-4 py-2.5">
        <b>{row.name}</b>
        {isSelf ? <span className="ml-1.5 text-[10.5px] text-brand-sub">(you)</span> : null}
      </td>
      <td className="px-4 py-2.5 text-brand-sub">{row.email}</td>
      <td className="px-4 py-2.5">{row.role.replace(/_/g, " ")}</td>
      <td className="px-4 py-2.5">
        <StatusBadge isActive={row.isActive} />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing(true)} className="font-semibold text-brand-green-dark">
            Edit
          </button>
          <button
            type="button"
            disabled={isSelf}
            onClick={handleToggleActive}
            title={isSelf ? "You cannot deactivate your own account" : undefined}
            className={`font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${row.isActive ? "text-brand-red" : "text-brand-green-dark"}`}
          >
            {row.isActive ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddAdminForm({ onCreated, onCancel }: { onCreated: (row: AdminUserRow) => void; onCancel: () => void }) {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<AddFormState>(EMPTY_ADD_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createAdminUser(accessToken, form);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create admin user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-b border-brand-line p-3.5">
      {error ? <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Temporary password (min. 8 characters)</span>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-brand-sub">Role</span>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
            className="mt-1 w-full rounded-[7px] border border-brand-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-green"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create admin"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AdminUsersContent() {
  const { accessToken, user } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getAdminUsers(accessToken)
      .then(setRows)
      .catch(() => setRows([]));
  }, [accessToken]);

  function handleChanged(updated: AdminUserRow) {
    setRows((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div>
      <AdminTopbar />
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[23px] font-bold">Admin Users</h1>
            <p className="mt-0.5 text-[13px] text-brand-sub">Manage who has access to this admin panel, and what they can do.</p>
          </div>
          {!showAddForm ? <Button onClick={() => setShowAddForm(true)}>+ Add admin</Button> : null}
        </div>

        <div className="mt-4 rounded-[10px] border border-brand-line bg-white">
          {showAddForm ? (
            <AddAdminForm
              onCreated={(created) => {
                setRows((prev) => [created, ...(prev ?? [])]);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : null}

          <table className="dt w-full text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-brand-sub">
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold">Email</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-brand-sub">
                    No admin users found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <AdminUserRowView key={row.id} row={row} isSelf={row.id === user?.id} onChanged={handleChanged} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <AdminUsersContent />
    </AdminShell>
  );
}
