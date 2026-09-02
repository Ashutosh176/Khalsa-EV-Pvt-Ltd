import { OrderStatus } from "@prisma/client";

// Section 14's lifecycle, plus Cancelled/Returned as branches. REFUNDED
// is intentionally unreachable via this map for now - marking an order
// "refunded" without an actual Razorpay refund behind it would be
// exactly the kind of fake critical-path implementation Section 57
// warns against; it becomes reachable once Razorpay refunds are wired.
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
  [OrderStatus.REFUNDED]: [],
};

// Section 16: "Fulfillment/shipping stage -> update stock per business
// rule." PACKED is treated as that stage - reservedStock becomes a real
// currentStock deduction the moment an item is physically pulled for
// shipping, not merely held.
export const STOCK_DEDUCTED_AT_OR_AFTER: OrderStatus[] = [
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export function isTransitionAllowed(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_ORDER_TRANSITIONS[from].includes(to);
}
