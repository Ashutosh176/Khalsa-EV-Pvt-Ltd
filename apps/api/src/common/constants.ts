export const DEFAULT_WAREHOUSE_CODE = "MAIN";

// Simple flat-rate shipping rule (Section 12). No per-item weight/distance
// calculation and no admin-configurable rates yet - deliberately simple
// for a solo dev; matches the "Free shipping over ₹2,999" homepage promo.
export const FREE_SHIPPING_THRESHOLD_PAISE = 299900;
export const FLAT_SHIPPING_FEE_PAISE = 9900;
