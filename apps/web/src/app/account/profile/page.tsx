"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@khalsa-ev/ui";
import type { CustomerUser } from "@khalsa-ev/types";
import { Header } from "../../../components/Header";
import { Footer } from "../../../components/Footer";
import { AccountNav } from "../../../components/AccountNav";
import { useAuth } from "../../../lib/auth-context";
import { changeCustomerPassword, updateCustomerProfile } from "../../../lib/api";

export default function ProfilePage() {
  const { user, accessToken, loading: authLoading, setUser } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 text-brand-ink">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-brand-ink">My account</h1>

        {authLoading ? (
          <p className="mt-8 text-sm text-slate-500">Loading...</p>
        ) : !user || !accessToken ? (
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
              <ProfileForm key={user.id} user={user} accessToken={accessToken} setUser={setUser} />
              <PasswordForm accessToken={accessToken} />
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

function ProfileForm({
  user,
  accessToken,
  setUser,
}: {
  user: CustomerUser;
  accessToken: string;
  setUser: (user: CustomerUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await updateCustomerProfile(accessToken, { name, phone: phone || undefined });
      setUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-brand-ink">Profile</h2>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl bg-brand-green/10 px-4 py-3 text-sm text-brand-green" role="status">
          Profile updated.
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Phone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          disabled
          value={user.email}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400"
        />
      </label>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

function PasswordForm({ accessToken }: { accessToken: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await changeCustomerPassword(accessToken, { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-brand-ink">Change password</h2>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl bg-brand-green/10 px-4 py-3 text-sm text-brand-green" role="status">
          Password changed.
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Current password</span>
        <input
          required
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">New password</span>
        <input
          required
          minLength={8}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-green"
        />
      </label>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
