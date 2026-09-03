"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@khalsa-ev/ui";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../lib/auth-context";

const HIGHLIGHTS: [string, string, string][] = [
  ["🏷️", "Exclusive Offers", "Get access to member-only deals and discounts."],
  ["⚡", "Easy & Fast Shopping", "Save addresses, quicker checkout and order tracking."],
  ["♡", "Wishlist & More", "Save your favorite products and shop anytime."],
  ["🛡️", "Secure & Reliable", "Your data is safe with us. Shop with confidence."],
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password, phone: phone || undefined });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-brand-ink">
      <Header />

      <div className="flex flex-col lg:min-h-[600px] lg:flex-row">
        <div className="hidden flex-col justify-center bg-gradient-to-br from-[#EEF5EC] to-white p-12 lg:flex lg:flex-1">
          <div className="text-[26px] font-extrabold leading-tight">
            Create Your Account
            <br />
            <span className="text-brand-green-dark">and Drive the Change!</span>
          </div>
          <p className="my-3 max-w-[340px] text-[13px] text-brand-sub">
            Join Khalsa EV Spare Parts and enjoy a seamless shopping experience with exclusive benefits.
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
          <div className="w-full max-w-[380px]">
            <h1 className="mb-0.5 text-center text-[21px] font-bold">Create Your Account</h1>
            <p className="mb-4 text-center text-[12.5px] text-brand-sub">Join Khalsa EV Spare Parts today</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error ? (
                <p className="rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11.5px] font-bold">Full Name</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1 w-full rounded-[7px] border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-brand-green"
                  />
                </label>
                <label className="block">
                  <span className="text-[11.5px] font-bold">Mobile Number</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your mobile number"
                    className="mt-1 w-full rounded-[7px] border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-brand-green"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[11.5px] font-bold">Email Address</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="mt-1 w-full rounded-[7px] border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-brand-green"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11.5px] font-bold">Password</span>
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="mt-1 w-full rounded-[7px] border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-brand-green"
                  />
                </label>
                <label className="block">
                  <span className="text-[11.5px] font-bold">Confirm Password</span>
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="mt-1 w-full rounded-[7px] border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-brand-green"
                  />
                </label>
              </div>
              <div className="text-[10.8px] text-brand-green-dark">✓ At least 8 characters</div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-brand-green-dark">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
