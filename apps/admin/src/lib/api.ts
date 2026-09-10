import type {
  AdminInventoryItem,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminProduct,
  AdminReturnListItem,
  AdminUser,
  Brand,
  Category,
  CompatibilityEntry,
  CreateProductInput,
  OrderStatus,
  PaginatedResult,
  ReturnStatus,
  UpdateProductInput,
  UpdateShipmentInput,
  VehicleBrand,
  VehicleModel,
  VehicleVariant,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// The access token lives only in React state (auth-context), so this module
// has no direct way to push a refreshed token back into it or to react to a
// refresh failure - these two hooks let auth-context register itself once
// on mount, without api.ts importing React/context code. Same pattern as
// apps/web/src/lib/api.ts.
let onTokenRefreshed: ((accessToken: string) => void) | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAuthEventHandlers(handlers: { onTokenRefreshed: (accessToken: string) => void; onSessionExpired: () => void }) {
  onTokenRefreshed = handlers.onTokenRefreshed;
  onSessionExpired = handlers.onSessionExpired;
}

// The access token is short-lived (15m) and, unlike apps/web, this app never
// refreshes it again after the initial page load - so any admin session left
// open past that window used to fail every request with "Invalid or expired
// token" instead of silently recovering. On a 401 (and only once, and never
// for the refresh call itself), exchange the refresh cookie for a new access
// token and replay the original request - the caller never sees the
// transient 401 in between.
async function authFetch<T>(path: string, accessToken: string | null, init?: RequestInit, isRetry = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    if (response.status === 401 && !isRetry && path !== "/auth/admin/refresh") {
      try {
        const { accessToken: refreshedToken } = await adminRefresh();
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
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

// --- Admin auth ---

type AuthResponse = { accessToken: string; user: AdminUser };

export function adminLogin(email: string, password: string) {
  return authFetch<AuthResponse>("/auth/admin/login", null, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function adminRefresh() {
  return authFetch<{ accessToken: string }>("/auth/admin/refresh", null, { method: "POST" });
}

export function adminLogout() {
  return authFetch<{ status: string }>("/auth/admin/logout", null, { method: "POST" });
}

export function getAdminMe(accessToken: string) {
  return authFetch<AdminUser>("/auth/admin/me", accessToken);
}

// --- Products ---

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  productType?: string;
  page?: number;
  pageSize?: number;
};

export function getAdminProducts(accessToken: string, filters: ProductFilters = {}) {
  return authFetch<PaginatedResult<AdminProduct>>(`/admin/products${toQueryString(filters)}`, accessToken);
}

export function getAdminProduct(accessToken: string, id: string) {
  return authFetch<AdminProduct>(`/admin/products/${id}`, accessToken);
}

export function createProduct(accessToken: string, dto: CreateProductInput) {
  return authFetch<AdminProduct>("/admin/products", accessToken, { method: "POST", body: JSON.stringify(dto) });
}

export function updateProduct(accessToken: string, id: string, dto: UpdateProductInput) {
  return authFetch<AdminProduct>(`/admin/products/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export function archiveProduct(accessToken: string, id: string) {
  return authFetch<AdminProduct>(`/admin/products/${id}`, accessToken, { method: "DELETE" });
}

// Multipart upload - deliberately bypasses authFetch, which hardcodes
// Content-Type: application/json. fetch() sets the correct
// multipart/form-data boundary itself when the body is a FormData, but
// only if we don't set Content-Type manually.
export async function uploadProductImages(accessToken: string, id: string, files: File[]): Promise<AdminProduct> {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);

  const response = await fetch(`${API_URL}/admin/products/${id}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
    body: formData,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `Image upload failed with ${response.status}`, response.status);
  }
  return response.json() as Promise<AdminProduct>;
}

export function deleteProductImage(accessToken: string, productId: string, imageId: string) {
  return authFetch<AdminProduct>(`/admin/products/${productId}/images/${imageId}`, accessToken, {
    method: "DELETE",
  });
}

export function getCategories() {
  return authFetch<Category[]>("/categories", null);
}

export function getBrands() {
  return authFetch<Brand[]>("/brands", null);
}

// --- Orders ---

export type OrderFilters = { status?: string; search?: string; page?: number; pageSize?: number };

export function getAdminOrders(accessToken: string, filters: OrderFilters = {}) {
  return authFetch<PaginatedResult<AdminOrderListItem>>(`/admin/orders${toQueryString(filters)}`, accessToken);
}

export function getAdminOrder(accessToken: string, id: string) {
  return authFetch<AdminOrderDetail>(`/admin/orders/${id}`, accessToken);
}

export function updateOrderStatus(accessToken: string, id: string, status: OrderStatus, note?: string) {
  return authFetch<AdminOrderDetail>(`/admin/orders/${id}/status`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export function updateOrderShipment(accessToken: string, id: string, dto: UpdateShipmentInput) {
  return authFetch<AdminOrderDetail>(`/admin/orders/${id}/shipment`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

// --- Returns ---

export type ReturnFilters = { status?: string; search?: string; page?: number; pageSize?: number };

export function getAdminReturns(accessToken: string, filters: ReturnFilters = {}) {
  return authFetch<PaginatedResult<AdminReturnListItem>>(`/admin/returns${toQueryString(filters)}`, accessToken);
}

export function getAdminReturn(accessToken: string, id: string) {
  return authFetch<AdminReturnListItem>(`/admin/returns/${id}`, accessToken);
}

export function updateReturnStatus(accessToken: string, id: string, status: ReturnStatus, adminNote?: string) {
  return authFetch<AdminReturnListItem>(`/admin/returns/${id}/status`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote }),
  });
}

// --- Inventory ---

export type InventoryFilters = {
  search?: string;
  categoryId?: string;
  brandId?: string;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export function getAdminInventory(accessToken: string, filters: InventoryFilters = {}) {
  return authFetch<PaginatedResult<AdminInventoryItem>>(`/admin/inventory${toQueryString(filters)}`, accessToken);
}

export function adjustInventory(accessToken: string, id: string, quantityChange: number, reason: string) {
  return authFetch<AdminInventoryItem>(`/admin/inventory/${id}/adjust`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ quantityChange, reason }),
  });
}

// --- Vehicles ---

export function getVehicleBrands() {
  return authFetch<VehicleBrand[]>("/vehicles/brands", null);
}

export function createVehicleBrand(accessToken: string, name: string) {
  return authFetch<VehicleBrand>("/vehicles/brands", accessToken, { method: "POST", body: JSON.stringify({ name }) });
}

export function getVehicleModels(vehicleBrandId: string) {
  return authFetch<VehicleModel[]>(`/vehicles/models${toQueryString({ vehicleBrandId })}`, null);
}

export function createVehicleModel(accessToken: string, vehicleBrandId: string, name: string) {
  return authFetch<VehicleModel>("/vehicles/models", accessToken, {
    method: "POST",
    body: JSON.stringify({ vehicleBrandId, name }),
  });
}

export function getVehicleVariants(vehicleModelId: string) {
  return authFetch<VehicleVariant[]>(`/vehicles/variants${toQueryString({ vehicleModelId })}`, null);
}

export function createVehicleVariant(accessToken: string, vehicleModelId: string, name: string) {
  return authFetch<VehicleVariant>("/vehicles/variants", accessToken, {
    method: "POST",
    body: JSON.stringify({ vehicleModelId, name }),
  });
}

// --- Compatibility ---

export function getProductCompatibility(productId: string) {
  return authFetch<CompatibilityEntry[]>(`/compatibility${toQueryString({ productId })}`, null);
}

export function addCompatibility(accessToken: string, productId: string, vehicleVariantId: string) {
  return authFetch<CompatibilityEntry>("/compatibility", accessToken, {
    method: "POST",
    body: JSON.stringify({ productId, vehicleVariantId }),
  });
}

export function removeCompatibility(accessToken: string, id: string) {
  return authFetch<{ status: string }>(`/compatibility/${id}`, accessToken, { method: "DELETE" });
}
