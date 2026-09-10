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
    <main className="theme-scooters min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7">
        {authLoading ? (
          <p className="text-sm text-brand-sub">Loading...</p>
        ) : !user || !accessToken ? (
          <div className="rounded-[10px] border border-dashed border-brand-line p-12 text-center">
            <p className="text-brand-sub">Log in to view your account.</p>
            <Link href="/login" className="mt-4 inline-block font-semibold text-brand-blue-dark">
              Log in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <AccountNav />

            <div className="flex-1 space-y-4">
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
    <form onSubmit={handleSubmit} className="space-y-3.5 rounded-[10px] border border-brand-line p-4">
      <b className="text-[15px]">Profile</b>

      {error ? (
        <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-[7px] bg-brand-blue-light px-4 py-2.5 text-[12.5px] text-brand-blue-dark" role="status">
          Profile updated.
        </p>
      ) : null}

      <label className="block">
        <span className="text-[12.5px] font-medium text-brand-sub">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-blue"
        />
      </label>

      <label className="block">
        <span className="text-[12.5px] font-medium text-brand-sub">Phone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-blue"
        />
      </label>

      <label className="block">
        <span className="text-[12.5px] font-medium text-brand-sub">Email</span>
        <input
          disabled
          value={user.email}
          className="mt-1.5 w-full rounded-[7px] border border-brand-line bg-brand-surface px-3.5 py-2.5 text-[13px] text-brand-sub"
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
    <form onSubmit={handleSubmit} className="space-y-3.5 rounded-[10px] border border-brand-line p-4">
      <b className="text-[15px]">Change password</b>

      {error ? (
        <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-[7px] bg-brand-blue-light px-4 py-2.5 text-[12.5px] text-brand-blue-dark" role="status">
          Password changed.
        </p>
      ) : null}

      <label className="block">
        <span className="text-[12.5px] font-medium text-brand-sub">Current password</span>
        <input
          required
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-blue"
        />
      </label>

      <label className="block">
        <span className="text-[12.5px] font-medium text-brand-sub">New password</span>
        <input
          required
          minLength={8}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-blue"
        />
      </label>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
