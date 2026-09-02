import type {
  CartView,
  CatalogProduct,
  CatalogProductDetail,
  Category,
  CustomerUser,
  PaginatedResult,
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
};

function toQueryString(params: Record<string, string | number | undefined>): string {
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

export function registerCustomer(dto: { email: string; password: string; name: string; phone?: string }) {
  return authFetch<AuthResponse>("/auth/register", null, { method: "POST", body: JSON.stringify(dto) });
}

export function loginCustomer(dto: { email: string; password: string }) {
  return authFetch<AuthResponse>("/auth/login", null, { method: "POST", body: JSON.stringify(dto) });
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
