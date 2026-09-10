import type {
  Address,
  AddressInput,
  Brand,
  CartView,
  CatalogProduct,
  CatalogProductDetail,
  Category,
  CreateReturnInput,
  CreateReviewInput,
  CustomerUser,
  MyReviewView,
  NotificationView,
  OrderView,
  PaginatedResult,
  ProductReviewsSummary,
  ReturnView,
  VehicleBrand,
  VehicleModel,
  VehicleVariant,
  WishlistItemView,
} from "@khalsa-ev/types";

// Falls back to the local API's default port for zero-config dev; set
// NEXT_PUBLIC_API_URL in the deploy environment for staging/production.
// Used by apiFetch, which also runs in Server Components (Node has no
// "current page" to resolve a relative URL against, so this must be
// absolute).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// authFetch only ever runs in the browser (every caller carries the
// httpOnly refresh/access-token cookie via credentials: "include"), so
// it can - and must - go through this app's own origin rather than
// API_URL directly. Calling the API's absolute origin straight from
// the browser makes the cookie cross-site (different hostname, not
// just a different port) whenever the app isn't served from
// "localhost", which requires SameSite=None; Secure - Secure needs
// HTTPS, which the API doesn't run. next.config.ts rewrites this path
// to the real API so the cookie stays same-site.
const AUTH_API_URL = "/api/v1";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`API request to ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// The access token lives only in React state (auth-context), so this
// module has no direct way to push a refreshed token back into it or to
// react to a refresh failure - these two hooks let auth-context register
// itself once on mount, without api.ts importing React/context code.
let onTokenRefreshed: ((accessToken: string) => void) | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAuthEventHandlers(handlers: { onTokenRefreshed: (accessToken: string) => void; onSessionExpired: () => void }) {
  onTokenRefreshed = handlers.onTokenRefreshed;
  onSessionExpired = handlers.onSessionExpired;
}

// Cart/wishlist/auth "me" calls need the caller's access token and the
// httpOnly refresh cookie - credentials: "include" sends/receives that
// cookie. The access token is short-lived (15m); rather than every one of
// this app's many authenticated call sites having to notice a 401, refresh,
// and retry itself, that happens once here: on a 401 (and only once, and
// never for the refresh call itself - a 401 there means the refresh cookie
// is gone, not that the access token needs refreshing), silently exchange
// the refresh cookie for a new access token and replay the original
// request. Only if that refresh itself fails do we give up and surface
// "session expired" - the caller never sees the transient 401 in between.
async function authFetch<T>(path: string, accessToken: string | null, init?: RequestInit, isRetry = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${AUTH_API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    if (response.status === 401 && !isRetry && path !== "/auth/refresh") {
      try {
        const { accessToken: refreshedToken } = await refreshCustomerSession();
        onTokenRefreshed?.(refreshedToken);
        return authFetch<T>(path, refreshedToken, init, true);
      } catch {
        onSessionExpired?.();
        throw new ApiError("Your session has expired. Please log in again.", 401);
      }
    }
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `Request to ${path} failed with ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

export type CatalogFilters = {
  search?: string;
  categoryId?: string;
  productType?: "SPARE_PART" | "SCOOTER" | "ACCESSORY";
  brandId?: string;
  vehicleVariantId?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
  featured?: boolean;
};

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getCatalogProducts(filters: CatalogFilters = {}) {
  return apiFetch<PaginatedResult<CatalogProduct>>(`/products${toQueryString(filters)}`);
}

export function getCatalogProduct(slug: string) {
  return apiFetch<CatalogProductDetail>(`/products/${encodeURIComponent(slug)}`);
}

export function getCategories() {
  return apiFetch<Category[]>("/categories");
}

// Public - approved reviews only. Runs fine in a Server Component (product
// detail pages fetch this alongside the product itself).
export function getProductReviews(productId: string) {
  return apiFetch<ProductReviewsSummary>(`/reviews?productId=${encodeURIComponent(productId)}`);
}

export function getBrands(filters: { productType?: "SPARE_PART" | "SCOOTER" | "ACCESSORY" } = {}) {
  return apiFetch<Brand[]>(`/brands${toQueryString(filters)}`);
}

export function getVehicleBrands() {
  return apiFetch<VehicleBrand[]>("/vehicles/brands");
}

export function getVehicleModels(vehicleBrandId: string) {
  return apiFetch<VehicleModel[]>(`/vehicles/models${toQueryString({ vehicleBrandId })}`);
}

export function getVehicleVariants(vehicleModelId: string) {
  return apiFetch<VehicleVariant[]>(`/vehicles/variants${toQueryString({ vehicleModelId })}`);
}

// --- Customer auth ---

type AuthResponse = { accessToken: string; user: CustomerUser };

export type OtpPurpose = "REGISTER" | "LOGIN";

export function registerCustomer(dto: {
  email: string;
  password: string;
  name: string;
  phone: string;
  phoneVerificationId: string;
}) {
  return authFetch<AuthResponse>("/auth/register", null, { method: "POST", body: JSON.stringify(dto) });
}

export function loginCustomer(dto: { email: string; password: string }) {
  return authFetch<AuthResponse>("/auth/login", null, { method: "POST", body: JSON.stringify(dto) });
}

export function loginCustomerWithOtp(dto: { phone: string; verificationId: string }) {
  return authFetch<AuthResponse>("/auth/login/otp", null, { method: "POST", body: JSON.stringify(dto) });
}

// The OTP itself is sent/verified client-side by MSG91's Widget SDK
// (window.sendOtp/verifyOtp) - this only redeems the resulting
// access-token server-side to get a verificationId register/login can use.
export function verifyWidgetOtp(phone: string, purpose: OtpPurpose, accessToken: string) {
  return authFetch<{ status: string; verificationId: string }>("/auth/otp/verify-widget", null, {
    method: "POST",
    body: JSON.stringify({ phone, purpose, accessToken }),
  });
}

export function refreshCustomerSession() {
  return authFetch<{ accessToken: string }>("/auth/refresh", null, { method: "POST" });
}

export function logoutCustomer() {
  return authFetch<{ status: string }>("/auth/logout", null, { method: "POST" });
}

export function getCurrentCustomer(accessToken: string) {
  return authFetch<CustomerUser>("/auth/me", accessToken);
}

export function updateCustomerProfile(accessToken: string, dto: { name?: string; phone?: string }) {
  return authFetch<CustomerUser>("/auth/me", accessToken, { method: "PATCH", body: JSON.stringify(dto) });
}

export function changeCustomerPassword(accessToken: string, dto: { currentPassword: string; newPassword: string }) {
  return authFetch<{ status: string }>("/auth/change-password", accessToken, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// --- Cart ---

export function getCart(accessToken: string) {
  return authFetch<CartView>("/cart", accessToken);
}

export function addCartItem(accessToken: string, dto: { productId: string; variantId?: string; quantity: number }) {
  return authFetch<CartView>("/cart/items", accessToken, { method: "POST", body: JSON.stringify(dto) });
}

export function updateCartItem(
  accessToken: string,
  itemId: string,
  dto: { quantity?: number; savedForLater?: boolean },
) {
  return authFetch<CartView>(`/cart/items/${itemId}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function removeCartItem(accessToken: string, itemId: string) {
  return authFetch<CartView>(`/cart/items/${itemId}`, accessToken, { method: "DELETE" });
}

// --- Wishlist ---

export function getWishlist(accessToken: string) {
  return authFetch<WishlistItemView[]>("/wishlist", accessToken);
}

export function addWishlistItem(accessToken: string, productId: string) {
  return authFetch<WishlistItemView[]>("/wishlist/items", accessToken, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export function removeWishlistItem(accessToken: string, itemId: string) {
  return authFetch<WishlistItemView[]>(`/wishlist/items/${itemId}`, accessToken, { method: "DELETE" });
}

export function moveWishlistItemToCart(accessToken: string, itemId: string) {
  return authFetch<{ wishlist: WishlistItemView[]; cart: CartView }>(
    `/wishlist/items/${itemId}/move-to-cart`,
    accessToken,
    { method: "POST" },
  );
}

// --- Addresses ---

export function getAddresses(accessToken: string) {
  return authFetch<Address[]>("/addresses", accessToken);
}

export function createAddress(accessToken: string, dto: AddressInput) {
  return authFetch<Address>("/addresses", accessToken, { method: "POST", body: JSON.stringify(dto) });
}

export function updateAddress(accessToken: string, id: string, dto: Partial<AddressInput>) {
  return authFetch<Address>(`/addresses/${id}`, accessToken, { method: "PATCH", body: JSON.stringify(dto) });
}

export function deleteAddress(accessToken: string, id: string) {
  return authFetch<Address>(`/addresses/${id}`, accessToken, { method: "DELETE" });
}

// --- Orders ---

export function createOrder(
  accessToken: string,
  dto: { shippingAddressId: string; billingAddressId?: string; couponCode?: string },
) {
  return authFetch<OrderView>("/orders", accessToken, { method: "POST", body: JSON.stringify(dto) });
}

// Preview only - order creation re-validates the code server-side against
// the authoritative subtotal, so this is just what lets the checkout page
// show a discount before the customer commits to placing the order.
export function validateCoupon(accessToken: string, code: string) {
  return authFetch<{ code: string; discountAmount: number }>("/coupons/validate", accessToken, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function getOrders(accessToken: string) {
  return authFetch<OrderView[]>("/orders", accessToken);
}

export function getOrder(accessToken: string, id: string) {
  return authFetch<OrderView>(`/orders/${id}`, accessToken);
}

export function cancelOrder(accessToken: string, id: string, reason?: string) {
  return authFetch<OrderView>(`/orders/${id}/cancel`, accessToken, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// --- Payments ---

export type InitiatePaymentResult = { razorpayOrderId: string; amount: number; currency: string; keyId: string };

export function initiatePayment(accessToken: string, orderId: string) {
  return authFetch<InitiatePaymentResult>(`/orders/${orderId}/pay`, accessToken, { method: "POST" });
}

export function verifyPayment(
  accessToken: string,
  orderId: string,
  dto: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
) {
  return authFetch<OrderView>(`/orders/${orderId}/verify-payment`, accessToken, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// --- Returns ---

export function getReturns(accessToken: string) {
  return authFetch<ReturnView[]>("/returns", accessToken);
}

export function createReturn(accessToken: string, dto: CreateReturnInput) {
  return authFetch<ReturnView>("/returns", accessToken, { method: "POST", body: JSON.stringify(dto) });
}

// --- Reviews ---

export function createReview(accessToken: string, dto: CreateReviewInput) {
  return authFetch<MyReviewView>("/reviews", accessToken, { method: "POST", body: JSON.stringify(dto) });
}

export function getMyReviews(accessToken: string) {
  return authFetch<MyReviewView[]>("/reviews/mine", accessToken);
}

// --- Notifications ---

export function getNotifications(accessToken: string) {
  return authFetch<NotificationView[]>("/notifications", accessToken);
}

export function markNotificationRead(accessToken: string, id: string) {
  return authFetch<{ status: string }>(`/notifications/${id}/read`, accessToken, { method: "PATCH" });
}

export function markAllNotificationsRead(accessToken: string) {
  return authFetch<{ status: string }>("/notifications/read-all", accessToken, { method: "POST" });
}
