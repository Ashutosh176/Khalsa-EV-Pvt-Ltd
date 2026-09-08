"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { initiatePayment, verifyPayment } from "./api";
import { isRazorpayLoaded } from "./razorpay";

type PayableOrder = { id: string; orderNumber: string };
type Customer = { name?: string | null; email?: string | null; phone?: string | null };

// Shared by the checkout page (pay immediately after placing an order)
// and the order detail page (retry payment on a still-PENDING order) -
// both just need "open Razorpay Checkout for this order, then land on
// its detail page" regardless of how the attempt turns out. Order
// confirmation itself only ever happens server-side, after signature
// verification (Section 13) - this only ever reflects that outcome.
export function useRazorpayCheckout() {
  const router = useRouter();

  return useCallback(
    async (
      accessToken: string,
      order: PayableOrder,
      customer: Customer,
      onError: (message: string) => void,
      // Called once the attempt settles either way - a successful payment
      // clears the cart server-side (PaymentsService.markPaid), so
      // whatever cart state the caller holds (e.g. the header badge) is
      // stale until it re-fetches.
      onSettled?: () => void,
    ) => {
      if (!isRazorpayLoaded()) {
        onError("Payment could not load. Please check your connection and try again.");
        return;
      }

      let payment;
      try {
        payment = await initiatePayment(accessToken, order.id);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Could not start payment. Please try again.");
        return;
      }

      const goToOrder = () => {
        onSettled?.();
        router.push(`/account/orders/${order.id}`);
      };

      const razorpay = new window.Razorpay!({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Khalsa EV",
        description: `Order ${order.orderNumber}`,
        order_id: payment.razorpayOrderId,
        prefill: {
          name: customer.name ?? undefined,
          email: customer.email ?? undefined,
          contact: customer.phone ?? undefined,
        },
        theme: { color: "#3ea345" },
        handler: (response) => {
          // A failed verify-payment call here just means the order stays
          // PENDING - the order page shows that and offers a retry, so
          // there's nothing more useful to do than let the navigation
          // happen and reflect whatever the server actually recorded.
          verifyPayment(accessToken, order.id, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
            .catch(() => undefined)
            .finally(goToOrder);
        },
        modal: { ondismiss: goToOrder },
      });
      razorpay.on("payment.failed", goToOrder);
      razorpay.open();
    },
    [router],
  );
}
