import type {
  CatalogProduct,
  CatalogProductDetail,
  Category,
  PaginatedResult,
  VehicleBrand,
  VehicleModel,
  VehicleVariant,
} from "@khalsa-ev/types";

// Falls back to the local API's default port for zero-config dev; set
// NEXT_PUBLIC_API_URL in the deploy environment for staging/production.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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
