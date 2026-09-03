"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@khalsa-ev/ui";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../lib/auth-context";

const HIGHLIGHTS: [string, string, string][] = [
  ["🛡️", "100% Genuine Parts", "Original & authentic products"],
  ["↩️", "7 Days Easy Returns", "Hassle-free returns"],
  ["🚚", "Fast Delivery Across India", "Pan India delivery"],
  ["🔒", "Secure Payment", "100% safe & secure"],
];

export default function LoginPage() {
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
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="flex flex-col lg:min-h-[560px] lg:flex-row">
        <div className="hidden flex-col justify-center bg-gradient-to-br from-[#EEF5EC] to-white p-12 lg:flex lg:flex-1">
          <div className="text-[26px] font-extrabold leading-tight">
            Powering Every
            <br />
            <span className="text-brand-green-dark">EV Journey</span>
          </div>
          <p className="my-3 max-w-[340px] text-[13px] text-brand-sub">
            India&apos;s most trusted destination for genuine EV spare parts &amp; accessories.
          </p>
          {HIGHLIGHTS.map(([icon, title, sub]) => (
            <div key={title} className="mb-3 flex items-center gap-2.5 text-[12.5px]">
              <span className="text-[17px]">{icon}</span>
              <span>
                <b>{title}</b>
                <br />
                <span className="text-brand-sub">{sub}</span>
              </span>
            </div>
          ))}
          <div className="mt-3.5 text-[70px] leading-none">🛵🔋</div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-[340px]">
            <h1 className="mb-0.5 text-center text-[21px] font-bold">Welcome Back!</h1>
            <p className="mb-4 text-center text-[12.5px] text-brand-sub">Login to your Khalsa EV account</p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error ? (
                <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
                  {error}
                </p>
              ) : null}

              <label className="block">
                <span className="text-[11.5px] font-bold">Email Address</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1 w-full rounded-[7px] border border-brand-line px-2.5 py-2.5 text-[12.5px] outline-none focus:border-brand-green"
                />
              </label>

              <label className="block">
                <span className="text-[11.5px] font-bold">Password</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1 w-full rounded-[7px] border border-brand-line px-2.5 py-2.5 text-[12.5px] outline-none focus:border-brand-green"
                />
              </label>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-brand-green-dark">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
