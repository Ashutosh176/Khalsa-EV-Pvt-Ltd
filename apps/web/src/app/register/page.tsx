"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PhoneOtpVerifier } from "../../components/PhoneOtpVerifier";
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "../../components/AuthIcons";
import { useAuth } from "../../lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<{ phone: string; verificationId: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!verifiedPhone) {
      setError("Please verify your mobile number before creating an account.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        phone: verifiedPhone.phone,
        phoneVerificationId: verifiedPhone.verificationId,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
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
          <h1 className="mb-1 text-center text-[24px] font-bold">Create Your Account</h1>
          <p className="mb-6 text-center text-[13px] text-brand-sub">Join Khalsa EV Spare Parts today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <p className="rounded-[12px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
                {error}
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold">Full Name</span>
              <span className="relative block">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-sub" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-full border border-brand-line py-3 pl-11 pr-4 text-[13px] outline-none focus:border-brand-blue"
                />
              </span>
            </label>

            <PhoneOtpVerifier
              purpose="REGISTER"
              onVerified={(phone, verificationId) => setVerifiedPhone({ phone, verificationId })}
            />

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold">Email Address</span>
              <span className="relative block">
                <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-sub" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-full border border-brand-line py-3 pl-11 pr-4 text-[13px] outline-none focus:border-brand-blue"
                />
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Password</span>
                <span className="relative block">
                  <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-brand-sub" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-full border border-brand-line py-3 pl-10 pr-9 text-[12.5px] outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-sub hover:text-brand-ink"
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Confirm Password</span>
                <span className="relative block">
                  <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-brand-sub" />
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full rounded-full border border-brand-line py-3 pl-10 pr-9 text-[12.5px] outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-sub hover:text-brand-ink"
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </span>
              </label>
            </div>
            <div className="text-[10.8px] text-brand-blue-dark">✓ At least 8 characters</div>

            <button
              type="submit"
              disabled={submitting || !verifiedPhone}
              className="w-full rounded-full bg-brand-blue-dark py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-blue disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
            {!verifiedPhone ? (
              <p className="text-center text-[10.5px] text-brand-sub">Verify your mobile number to continue</p>
            ) : null}
          </form>

          <p className="mt-5 text-center text-[13px]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand-blue-dark">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
