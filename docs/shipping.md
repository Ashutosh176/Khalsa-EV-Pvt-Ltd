# Shipping & notifications

## What's built (Phase 10)

### Shipping

`ShippingService` (`apps/api/src/shipping/shipping.service.ts`) is the abstraction
Section 25 asks for - "keep shipping integration behind a service abstraction so
another provider or method can be added later." It exposes two methods:

- `syncStatus(tx, orderId, orderStatus)` - called from `OrdersService.updateStatusAdmin`
  inside the same transaction as every admin-driven order status change. It maps
  `OrderStatus` to `ShipmentStatus` (`PACKED -> PACKED`, `SHIPPED -> SHIPPED`,
  `OUT_FOR_DELIVERY -> OUT_FOR_DELIVERY`, `DELIVERED -> DELIVERED`,
  `RETURNED -> RETURNED`) and upserts the `Shipment` row, stamping `shippedAt`/
  `deliveredAt` at the matching transition. Statuses with no shipment stage yet
  (`PENDING`, `CONFIRMED`, `PROCESSING`, `CANCELLED`) leave the row untouched.
- `updateTracking(orderId, dto)` - upserts courier name, AWB number, tracking
  URL, and expected delivery date. Exposed to admins via
  `PATCH /admin/orders/:id/shipment`.

**What's deferred: live Shiprocket integration.** No Shiprocket credentials are
available yet (`SHIPROCKET_EMAIL`/`SHIPROCKET_PASSWORD`/`SHIPROCKET_CHANNEL_ID`
are still empty in `.env`). Per Section 45 ("do not create fake production
functionality"), there is no code that pretends to call a courier API. Until
credentials exist, this is the *manual* provider: shipment status advances
automatically with the order lifecycle, and an admin enters courier/AWB/tracking
info by hand on the order detail page. A real `ShiprocketShippingService`
implementing the same `syncStatus`/`updateTracking` shape (plus actually calling
the Shiprocket API to auto-generate the AWB) can replace this without
`OrdersService` changing at all.

Customer-facing tracking follows the existing "no live map" design (Sections 15
& 56) - the order detail page shows status + timeline + whatever courier/AWB/
tracking-link info an admin has entered, nothing more.

Scooter shipping (Section 59 - Shiprocket is built for small courier parcels,
not freight) remains an open business decision, unaffected by this phase since
no scooter has gone through checkout yet.

### Notifications

`NotificationsService` (`apps/api/src/notifications/notifications.service.ts`)
reads/writes the `Notification` table that's existed in the schema since Phase 3
but had no writer until now. `GET /notifications`, `PATCH /notifications/:id/read`,
`POST /notifications/read-all` are customer-guarded endpoints backing
`/account/notifications` and the unread-count badge next to "Account" in the
header.

Rows are created from two trigger points in `OrdersService`:

- Every admin-driven status transition (`updateStatusAdmin`) - `NotificationType.SHIPMENT`
  for the shipment-stage statuses (`PACKED`/`SHIPPED`/`OUT_FOR_DELIVERY`/`DELIVERED`/`RETURNED`),
  `NotificationType.ORDER` for the rest (`CONFIRMED`/`PROCESSING`/`CANCELLED`).
- Customer self-cancel (`cancel`) - `NotificationType.ORDER`.

Notification creation happens after the order-status transaction commits, not
inside it - a notification failing to write should never roll back a real order
status change.

**What's deferred: transactional email.** No Resend API key is available yet
(`RESEND_API_KEY` is empty in `.env`). Section 26 calls for emails on
registration, order confirmation, payment confirmation, shipment, delivery, and
refund - none of that is wired up. `NotificationsService.create()` is the single
call site where an email send would be added later (alongside the in-app row),
so nothing about the trigger points above needs to change when a Resend key is
available - only `NotificationsService.create()` gains an email side effect.

Returns don't yet have an admin-facing status workflow (a `Return` stays
`REQUESTED` until that's built), so no notification fires when a return's
status changes - that's return-management, not shipping/notifications, and is
left for a later phase.
