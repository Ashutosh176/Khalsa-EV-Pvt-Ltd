"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@khalsa-ev/ui";
import { useAuth } from "../../lib/auth-context";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center">
          <Image src="/logo.png" alt="Khalsa EV" width={292} height={162} className="h-14 w-auto" priority />
          <h1 className="mt-3.5 text-[21px] font-bold">Khalsa EV Admin</h1>
          <p className="text-[13px] text-brand-sub">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 rounded-[10px] border border-brand-line bg-white p-5">
          {error ? (
            <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="text-[12.5px] font-medium text-brand-sub">Email</span>
            <input
              required
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
            />
          </label>

          <label className="block">
            <span className="text-[12.5px] font-medium text-brand-sub">Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-[7px] border border-brand-line px-3.5 py-2.5 text-[13px] outline-none focus:border-brand-green"
            />
          </label>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-brand-sub">
          Admin access only. There is no public registration for this panel.
        </p>
      </div>
    </main>
  );
}
