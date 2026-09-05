"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@khalsa-ev/ui";
import { PhoneOtpVerifier } from "../../components/PhoneOtpVerifier";
import { useAuth } from "../../lib/auth-context";

const HIGHLIGHTS: [string, string, string][] = [
  ["🛡️", "100% Genuine Parts", "Original & authentic products"],
  ["↩️", "7 Days Easy Returns", "Hassle-free returns"],
  ["🚚", "Fast Delivery Across India", "Pan India delivery"],
  ["🔒", "Secure Payment", "100% safe & secure"],
];

export default function LoginPage() {
  const { login, loginWithOtp } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"password" | "otp">("password");
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
    <main className="min-h-screen bg-white text-brand-ink">
      <div className="flex flex-col lg:min-h-screen lg:flex-row">
        <div className="hidden flex-col justify-center bg-gradient-to-br from-[#EEF5EC] to-white p-12 lg:flex lg:flex-1">
          <Link href="/" className="mb-6 flex items-center">
            <Image src="/logo.png" alt="Khalsa EV" width={292} height={162} className="h-10 w-auto" priority />
          </Link>
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

            <div className="mb-4 flex rounded-[8px] border border-brand-line p-1 text-[12.5px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTab("password");
                  setError(null);
                }}
                className={`flex-1 rounded-[6px] py-1.5 ${tab === "password" ? "bg-brand-green-dark text-white" : "text-brand-sub"}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("otp");
                  setError(null);
                }}
                className={`flex-1 rounded-[6px] py-1.5 ${tab === "otp" ? "bg-brand-green-dark text-white" : "text-brand-sub"}`}
              >
                Login with OTP
              </button>
            </div>

            {error ? (
              <p className="mb-3.5 rounded-[7px] bg-red-50 px-4 py-2.5 text-[12.5px] text-brand-red" role="alert">
                {error}
              </p>
            ) : null}

            {tab === "password" ? (
              <form onSubmit={handleSubmit} className="space-y-3.5">
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
            ) : (
              <div className="space-y-3.5">
                <PhoneOtpVerifier purpose="LOGIN" onVerified={(phone, verificationId) => void handleOtpVerified(phone, verificationId)} />
                {submitting ? <p className="text-center text-[12.5px] text-brand-sub">Logging in...</p> : null}
              </div>
            )}

            <p className="mt-4 text-center text-xs">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-brand-green-dark">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
