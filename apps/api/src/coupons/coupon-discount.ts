import { Coupon, CouponType } from "@prisma/client";

// A FLAT coupon can never discount more than the order itself (a ₹500-off
// coupon against a ₹300 cart discounts ₹300, not ₹500 - not a negative
// total). A PERCENTAGE coupon is capped by maxDiscountAmount when set.
export function computeCouponDiscount(coupon: Pick<Coupon, "type" | "value" | "maxDiscountAmount">, subtotal: number): number {
  if (coupon.type === CouponType.PERCENTAGE) {
    const raw = Math.round((subtotal * coupon.value) / 100);
    const capped = coupon.maxDiscountAmount != null ? Math.min(raw, coupon.maxDiscountAmount) : raw;
    return Math.min(capped, subtotal);
  }
  return Math.min(coupon.value, subtotal);
}
