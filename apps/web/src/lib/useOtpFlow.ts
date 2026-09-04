"use client";

import { useCallback, useEffect, useState } from "react";
import { verifyWidgetOtp, type OtpPurpose } from "./api";
import { extractWidgetMessage, isMsg91WidgetReady, MSG91_WIDGET_READY_EVENT } from "./msg91-widget";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
// Matches this MSG91 widget's configured resend interval (Widgets ->
// SecureOTPWidget2Y04 -> "Resend After: 10 seconds").
export const OTP_RESEND_COOLDOWN_SECONDS = 10;

export type OtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified";

// Shared by the Register page (phone verification gate before signup)
// and the Login page's OTP tab (phone verification before OTP login).
// The actual OTP send/verify happens client-side via MSG91's Widget
// SDK (window.sendOtp/verifyOtp, loaded in the root layout) - this
// hook only wraps that JS callback API in React state, then redeems
// the resulting access-token against our own backend to get a
// verificationId, so register/login can consume it exactly like before.
export function useOtpFlow(purpose: OtpPurpose) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [widgetReady, setWidgetReady] = useState(isMsg91WidgetReady);

  useEffect(() => {
    if (widgetReady) return;
    const onReady = () => setWidgetReady(true);
    window.addEventListener(MSG91_WIDGET_READY_EVENT, onReady);
    // Fallback poll in case this component mounts before the ready
    // event fires and after the listener above was already missed.
    const poll = setInterval(() => {
      if (isMsg91WidgetReady()) setWidgetReady(true);
    }, 300);
    return () => {
      window.removeEventListener(MSG91_WIDGET_READY_EVENT, onReady);
      clearInterval(poll);
    };
  }, [widgetReady]);

  const isPhoneValid = INDIAN_MOBILE_REGEX.test(phone);

  const send = useCallback(() => {
    setError(null);
    setStatus("sending");
    window.sendOtp?.(
      `91${phone}`,
      () => {
        setStatus("sent");
        setCooldownUntil(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
      },
      (err) => {
        setError(extractWidgetMessage(err) ?? "Could not send OTP. Please try again.");
        setStatus("idle");
      },
    );
  }, [phone]);

  const resend = useCallback(() => {
    setError(null);
    window.retryOtp?.(
      null,
      () => setCooldownUntil(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000),
      (err) => setError(extractWidgetMessage(err) ?? "Could not resend OTP. Please try again."),
    );
  }, []);

  const verify = useCallback(() => {
    setError(null);
    setStatus("verifying");
    window.verifyOtp?.(
      otp,
      (data) => {
        const accessToken = extractWidgetMessage(data);
        if (!accessToken) {
          setError("Verification succeeded but no token was returned. Please try again.");
          setStatus("sent");
          return;
        }
        verifyWidgetOtp(phone, purpose, accessToken)
          .then((result) => {
            setVerificationId(result.verificationId);
            setStatus("verified");
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Could not verify your phone. Please try again.");
            setStatus("sent");
          });
      },
      (err) => {
        setError(extractWidgetMessage(err) ?? "Incorrect OTP. Please try again.");
        setStatus("sent");
      },
    );
  }, [otp, phone, purpose]);

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
    widgetReady,
    send,
    resend,
    verify,
    reset,
  };
}
