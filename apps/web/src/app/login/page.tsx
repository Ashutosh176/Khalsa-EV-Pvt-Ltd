"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PhoneOtpVerifier } from "../../components/PhoneOtpVerifier";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "../../components/AuthIcons";
import { useAuth } from "../../lib/auth-context";

export default function LoginPage() {
  const { login, loginWithOtp } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  async function handleOtpVerified(phone: string, verificationId: string) {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithOtp(phone, verificationId);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="theme-scooters relative min-h-screen overflow-x-hidden text-brand-ink">
      {/* Full-viewport background - fixed so it always covers 100% of the
          screen regardless of how tall the form makes the page, independent
          of scroll position. */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/auth-bg-clean.png"
          alt="Khalsa EV - electric scooter, genuine spare parts and Khalsa EV branding"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Subtle, targeted darkening behind the card only - the rest of the
            scene (scooter, parts, logo) stays at full brightness. */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-black/5 to-transparent" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-12 lg:justify-end lg:px-16 xl:px-24">
        <div className="w-full max-w-[480px] rounded-[28px] bg-white/95 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
          <h1 className="mb-1 text-center text-[24px] font-bold">Welcome Back!</h1>
          <p className="mb-6 text-center text-[13px] text-brand-sub">Login to your Khalsa EV account</p>

          <div className="mb-6 flex rounded-full bg-brand-surface p-1 text-[13px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab("password");
                setError(null);
              }}
              className={`flex-1 rounded-full py-2.5 transition-colors ${tab === "password" ? "bg-brand-blue-dark text-white shadow-sm" : "text-brand-sub"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("otp");
                setError(null);
              }}
              className={`flex-1 rounded-full py-2.5 transition-colors ${tab === "otp" ? "bg-brand-blue-dark text-white shadow-sm" : "text-brand-sub"}`}
            >
              Login with OTP
            </button>
          </div>

          {error ? (
            <p className="mb-4 rounded-[12px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
              {error}
            </p>
          ) : null}

          {tab === "password" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Email Address</span>
                <span className="relative block">
                  <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-sub" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-full border border-brand-line py-3 pl-11 pr-4 text-[13px] outline-none focus:border-brand-blue"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Password</span>
                <span className="relative block">
                  <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-sub" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-full border border-brand-line py-3 pl-11 pr-11 text-[13px] outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-sub hover:text-brand-ink"
                  >
                    {showPassword ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-brand-blue-dark py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-blue disabled:opacity-60"
              >
                {submitting ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <div className="space-y-3.5">
              <PhoneOtpVerifier purpose="LOGIN" onVerified={(phone, verificationId) => void handleOtpVerified(phone, verificationId)} />
              {submitting ? <p className="text-center text-[12.5px] text-brand-sub">Logging in...</p> : null}
            </div>
          )}

          <p className="mt-5 text-center text-[13px]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-brand-blue-dark">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
