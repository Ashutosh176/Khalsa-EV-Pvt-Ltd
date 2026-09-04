"use client";

import { useEffect, useState } from "react";
import { useOtpFlow } from "../lib/useOtpFlow";
import type { OtpPurpose } from "../lib/api";

function useCountdown(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export function PhoneOtpVerifier({
  purpose,
  label = "Mobile Number",
  onVerified,
}: {
  purpose: OtpPurpose;
  label?: string;
  onVerified?: (phone: string, verificationId: string) => void;
}) {
  const flow = useOtpFlow(purpose);
  const secondsLeft = useCountdown(flow.cooldownUntil);
  const canResend = flow.status === "sent" && secondsLeft === 0;

  if (flow.status === "verified" && flow.verificationId) {
    return (
      <div>
        <span className="text-[11.5px] font-bold">{label}</span>
        <div className="mt-1 flex items-center justify-between rounded-[7px] border border-brand-green-line bg-brand-green-light px-2.5 py-2 text-xs">
          <span>+91 {flow.phone}</span>
          <span className="font-bold text-brand-green-dark">✓ Verified</span>
        </div>
        <VerifiedNotifier phone={flow.phone} verificationId={flow.verificationId} onVerified={onVerified} />
      </div>
    );
  }

  return (
    <div>
      <span className="text-[11.5px] font-bold">{label}</span>

      <div className="mt-1 flex gap-2">
        <span className="flex items-center rounded-[7px] border border-brand-line bg-brand-surface px-2.5 text-xs text-brand-sub">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={flow.phone}
          disabled={flow.status === "sent" || flow.status === "verifying"}
          onChange={(e) => flow.setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
          className="w-full rounded-[7px] border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-brand-green disabled:bg-brand-surface disabled:text-brand-sub"
        />
        {flow.status === "idle" || flow.status === "sending" ? (
          <button
            type="button"
            disabled={!flow.isPhoneValid || flow.status === "sending" || !flow.widgetReady}
            onClick={flow.send}
            className="shrink-0 rounded-[7px] bg-brand-green-dark px-3 text-xs font-bold text-white disabled:opacity-40"
          >
            {flow.status === "sending" ? "Sending..." : flow.widgetReady ? "Send OTP" : "Loading..."}
          </button>
        ) : (
          <button
            type="button"
            onClick={flow.reset}
            className="shrink-0 rounded-[7px] border border-brand-line px-3 text-xs font-semibold text-brand-sub"
          >
            Change
          </button>
        )}
      </div>

      {flow.status === "sent" || flow.status === "verifying" ? (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={flow.otp}
            onChange={(e) => flow.setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter OTP"
            className="w-full rounded-[7px] border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-brand-green"
          />
          <button
            type="button"
            disabled={flow.otp.length < 4 || flow.status === "verifying"}
            onClick={flow.verify}
            className="shrink-0 rounded-[7px] bg-brand-green px-3 text-xs font-bold text-white disabled:opacity-40"
          >
            {flow.status === "verifying" ? "Verifying..." : "Verify"}
          </button>
        </div>
      ) : null}

      {flow.status === "sent" || flow.status === "verifying" ? (
        <div className="mt-1.5 text-[10.5px] text-brand-sub">
          {canResend ? (
            <button type="button" onClick={flow.resend} className="font-bold text-brand-green-dark">
              Resend OTP
            </button>
          ) : (
            `Resend OTP in ${secondsLeft}s`
          )}
        </div>
      ) : null}

      {flow.error ? <p className="mt-1.5 text-[10.5px] text-brand-red">{flow.error}</p> : null}
    </div>
  );
}

function VerifiedNotifier({
  phone,
  verificationId,
  onVerified,
}: {
  phone: string;
  verificationId: string;
  onVerified?: (phone: string, verificationId: string) => void;
}) {
  useEffect(() => {
    onVerified?.(phone, verificationId);
    // Runs once per fresh verificationId - onVerified is a stable
    // per-render closure from the parent, not a dependency we track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationId]);
  return null;
}
