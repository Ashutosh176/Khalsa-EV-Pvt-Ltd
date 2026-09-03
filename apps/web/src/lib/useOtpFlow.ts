"use client";

import { useCallback, useState } from "react";
import { sendOtp, verifyOtp, type OtpPurpose } from "./api";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export type OtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified";

// Shared by the Register page (phone verification gate before signup)
// and the Login page's OTP tab (phone verification before OTP login) -
// both send/verify against the same backend endpoints, just consume
// the resulting verificationId differently once verified.
export function useOtpFlow(purpose: OtpPurpose) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const isPhoneValid = INDIAN_MOBILE_REGEX.test(phone);

  const send = useCallback(async () => {
    setError(null);
    setStatus("sending");
    try {
      await sendOtp(phone, purpose);
      setStatus("sent");
      setCooldownUntil(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP. Please try again.");
      setStatus("idle");
    }
  }, [phone, purpose]);

  const verify = useCallback(async () => {
    setError(null);
    setStatus("verifying");
    try {
      const result = await verifyOtp(phone, purpose, otp);
      setVerificationId(result.verificationId);
      setStatus("verified");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect OTP. Please try again.");
      setStatus("sent");
    }
  }, [phone, purpose, otp]);

  const reset = useCallback(() => {
    setOtp("");
    setStatus("idle");
    setVerificationId(null);
    setError(null);
    setCooldownUntil(null);
  }, []);

  return {
    phone,
    setPhone,
    otp,
    setOtp,
    status,
    verificationId,
    error,
    isPhoneValid,
    cooldownUntil,
    send,
    verify,
    reset,
  };
}
