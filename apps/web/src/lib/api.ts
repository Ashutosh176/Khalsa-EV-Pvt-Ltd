import type {
  Address,
  AddressInput,
  Brand,
  CartView,
  CatalogProduct,
  CatalogProductDetail,
  Category,
  CreateReturnInput,
  CustomerUser,
  NotificationView,
  OrderView,
  PaginatedResult,
  ReturnView,
  VehicleBrand,
  VehicleModel,
  VehicleVariant,
  WishlistItemView,
} from "@khalsa-ev/types";

// Falls back to the local API's default port for zero-config dev; set
// NEXT_PUBLIC_API_URL in the deploy environment for staging/production.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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

// Cart/wishlist/auth "me" calls need the caller's access token and the
// httpOnly refresh cookie (for silent refresh on 401 upstream of this
// helper) - credentials: "include" sends/receives that cookie.
async function authFetch<T>(path: string, accessToken: string | null, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `Request to ${path} failed with ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

export type CatalogFilters = {
  search?: string;
  categoryId?: string;
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

export function getBrands() {
  return apiFetch<Brand[]>("/brands");
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

export function createOrder(accessToken: string, dto: { shippingAddressId: string; billingAddressId?: string }) {
  return authFetch<OrderView>("/orders", accessToken, { method: "POST", body: JSON.stringify(dto) });
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

// --- Returns ---

export function getReturns(accessToken: string) {
  return authFetch<ReturnView[]>("/returns", accessToken);
}

export function createReturn(accessToken: string, dto: CreateReturnInput) {
  return authFetch<ReturnView>("/returns", accessToken, { method: "POST", body: JSON.stringify(dto) });
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
