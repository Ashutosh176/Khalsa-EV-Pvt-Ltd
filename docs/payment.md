# Checkout & payment

## What's built (Phase 7)

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
   concurrent orders for the last unit can't both succeed. Verified against
   the real database with genuinely concurrent requests (20 units requested
   by each of two customers against 25 in stock): one order was created, the
   other got a clean `409 Conflict`, final `reservedStock` was exactly 20.
5. Writes the first `OrderStatusHistory` row (`PENDING`).

`POST /orders/:id/cancel` (customer-initiated, only while `PENDING`) reverses
the reservation - releases `reservedStock` per item, logs a `RELEASE`
`StockMovement`, sets `CANCELLED`.

**The cart is deliberately left untouched by order creation.** There's no
payment step yet, so nothing has actually been purchased - clearing the cart
belongs at payment confirmation (see below), not at order creation.

No coupon system is wired up yet (`discountAmount` is always 0) - `Coupon`
exists in the schema but application logic for it hasn't been built.

## What's deferred: Razorpay

Explicitly not built this phase, at the user's direction (no Razorpay test
credentials available yet to verify against):

- Creating a Razorpay order for the `Order.totalAmount` and returning the
  checkout params to the frontend.
- `POST /orders/:id/verify-payment` - signature verification
  (`hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)`)
  before ever marking a `Payment`/`Order` as paid. Per Section 13, a
  frontend-only "payment successful" message must never be trusted - there is
  intentionally no code path anywhere that marks an order `CONFIRMED` without
  this verification.
- `POST /payments/webhook` - Razorpay webhook handling (separate signature
  scheme from checkout verification, using `RAZORPAY_WEBHOOK_SECRET`), with
  idempotent handling for duplicate webhook delivery.
- Clearing the cart and transitioning `Order` to `CONFIRMED` once payment is
  verified.

The `Payment` model already exists in the schema and `Order.status` already
supports the `PENDING -> CONFIRMED` transition, so none of this needs a schema
change - it's purely the Razorpay-facing service/controller code, to be added
once test credentials are available.
