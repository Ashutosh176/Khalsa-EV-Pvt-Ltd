// Types for the global window.Razorpay constructor that checkout.js
// (loaded in apps/web/src/app/layout.tsx) attaches once it finishes
// loading - see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/.
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
};

export type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error: { description?: string } }) => void) => void;
};

export function isRazorpayLoaded(): boolean {
  return typeof window !== "undefined" && typeof window.Razorpay === "function";
}
