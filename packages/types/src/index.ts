export type ApiHealth = {
  status: "ok";
  timestamp: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  badge: string;
  rating: number;
  reviewCount: number;
  imageLabel: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  trend: string;
};

// Real API-backed types (Phase 5+). Money fields are integer paise.

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  sku: string;
  partNumber: string | null;
  name: string;
  description: string | null;
  productType: "SPARE_PART" | "SCOOTER" | "ACCESSORY";
  price: number;
  mrp: number;
  gstPercent: string;
  warrantyMonths: number | null;
  specifications: Record<string, string | number> | null;
  category: Category;
  brand: Brand | null;
  images: ProductImage[];
  inStock: boolean;
  availableStock: number;
};

export type VehicleBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type VehicleModel = {
  id: string;
  vehicleBrandId: string;
  name: string;
  slug: string;
};

export type VehicleVariant = {
  id: string;
  vehicleModelId: string;
  name: string;
};

export type ProductCompatibilityEntry = {
  id: string;
  notes: string | null;
  vehicleVariant: {
    name: string;
    model: { name: string; brand: { name: string } };
  };
  vehicleYear: { year: number } | null;
};

export type CatalogProductDetail = CatalogProduct & {
  compatibility: ProductCompatibilityEntry[];
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Customer auth + cart/wishlist (Phase 6)

export type CustomerUser = {
  id: string;
  name: string;
  email: string;
};

export type CartItemView = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  savedForLater: boolean;
  unitPrice: number;
  mrp: number;
  lineTotal: number;
  inStock: boolean;
  product: { name: string; slug: string; sku: string; imageUrl?: string };
  variant: { color: string | null } | null;
};

export type CartView = {
  items: CartItemView[];
  itemCount: number;
  subtotal: number;
  totalMrp: number;
  totalSavings: number;
};

export type WishlistItemView = {
  id: string;
  productId: string;
  product: {
    name: string;
    slug: string;
    sku: string;
    price: number;
    mrp: number;
    imageUrl?: string;
    inStock: boolean;
  };
};
