# Checkout & payment

## What's built

`POST /api/v1/orders` turns a customer's cart into an `Order`:

1. Validates the shipping (and optional billing) address belongs to the caller.
2. Reads the customer's active (not saved-for-later) cart items, re-pricing every
   line from live `Product`/`ProductVariant` data - never trusts anything cached
   on the cart item (Section 11).
3. Computes `subtotal`, a flat-rate `shippingAmount` (waived at/above
   ₹2,999 - `FREE_SHIPPING_THRESHOLD_PAISE` in `common/constants.ts`), and
   `taxAmount` as an informational reverse-GST extraction (product prices are
   GST-inclusive, so tax is the portion already inside the price, not added on
   top - `totalAmount = subtotal - discountAmount + shippingAmount`).
4. In one DB transaction: creates the `Order` + `OrderItem` rows, and
   atomically reserves stock per item via a raw conditional `UPDATE ...
   WHERE ("currentStock" - "reservedStock") >= quantity` - the availability
   check and the reservation happen as one indivisible SQL statement, so two
   concurrent orders for the last unit can't both succeed.
5. Writes the first `OrderStatusHistory` row (`PENDING`).

`POST /orders/:id/cancel` (customer-initiated, only while `PENDING`) reverses
the reservation - releases `reservedStock` per item, logs a `RELEASE`
`StockMovement`, sets `CANCELLED`.

**The cart is left untouched by order creation.** Nothing is purchased yet at
that point - it's only cleared once payment is actually verified (see below).

No coupon system is wired up yet (`discountAmount` is always 0) - `Coupon`
exists in the schema but application logic for it hasn't been built.

## Razorpay integration

`RazorpayClient` (`apps/api/src/payments/razorpay.client.ts`) talks to
Razorpay's REST API directly via `fetch` + Basic Auth (same pattern as
`Msg91Client`) - no SDK dependency. Three operations:

- `createOrder(amountPaise, receipt)` - `POST /v1/orders` with
  `payment_capture: 1` (auto-capture on success).
- `verifyCheckoutSignature(orderId, paymentId, signature)` -
  `hmac_sha256(order_id + "|" + payment_id, key_secret)`, timing-safe
  compared. This is what stands between "the browser said payment
  succeeded" and actually marking anything paid (Section 13) - there is no
  code path that confirms an order without it.
- `verifyWebhookSignature(rawBody, signature)` - a separate scheme keyed by
  `RAZORPAY_WEBHOOK_SECRET`, computed over the raw request body
  (`app.rawBody`, enabled in `main.ts`'s `NestFactory.create` options).

**Checkout flow** (`PaymentsService`, `apps/api/src/payments/payments.service.ts`):

1. `POST /orders/:id/pay` - creates (or, on retry, reuses) a Razorpay order
   for `Order.totalAmount`, persisting a `Payment` row with its
   `razorpayOrderId`. Returns `{ razorpayOrderId, amount, currency, keyId }`
   for the frontend to open Razorpay Checkout with.
2. The web checkout page (`apps/web/src/app/checkout/page.tsx`) and the
   order detail page's "Pay Now" retry (`apps/web/src/app/account/orders/[id]/page.tsx`)
   both drive this through the shared `useRazorpayCheckout` hook
   (`apps/web/src/lib/useRazorpayCheckout.ts`), which opens Razorpay
   Checkout (loaded globally in `layout.tsx` via `checkout.razorpay.com/v1/checkout.js`).
3. On Checkout's success callback, the frontend calls
   `POST /orders/:id/verify-payment` with the `razorpay_order_id`,
   `razorpay_payment_id`, `razorpay_signature` triple. The server verifies
   the signature, then confirms the order.
4. `POST /payments/webhook` (public, signature-verified, no auth guard) is
   Razorpay's independent server-to-server confirmation - handles
   `payment.captured` and `payment.failed`, so a payment still gets
   recorded even if the customer's browser never calls back (closed tab,
   network drop, etc).

Both paths 3 and 4 fall into the same `PaymentsService.markPaid`, which is
idempotent against the checkout callback and the webhook racing each other
(re-checks `Payment.status` inside the DB transaction). Confirming a
payment: marks `Payment` `PAID`, transitions `Order` `PENDING -> CONFIRMED`,
writes an `OrderStatusHistory` row, clears the customer's active cart items,
and sends a `PAYMENT` notification.

A failed/abandoned checkout attempt leaves the order `PENDING` with its
`Payment` row still there (or marked `FAILED`) - the customer can retry from
the order detail page's "Pay Now" button, which reuses the same Razorpay
order rather than creating a new one.

**Verified against the real Razorpay test API** (order creation + the full
Checkout -> signature verification -> order confirmation -> cart-clear path,
with a Razorpay test-mode card, including the OTP step) - see git history
for the smoke test used, not kept in the repo.

## Still not built

- Refunds (`Refund` model + `RAZORPAY_REFUND_ID` exist in the schema;
  `ALLOWED_ORDER_TRANSITIONS` deliberately has no path to `REFUNDED` yet -
  wire this up alongside the Returns flow).
- `RAZORPAY_WEBHOOK_SECRET` is not yet set - the webhook endpoint exists and
  verifies signatures, but no webhook is registered with Razorpay against it
  yet, so in practice only the checkout-callback path (`verify-payment`)
  confirms payments today.
