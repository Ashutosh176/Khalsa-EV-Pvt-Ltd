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

// 1:1 extension of CatalogProduct when productType is SCOOTER - see
// ScooterSpecification in schema.prisma. Absent on spare parts/accessories.
export type ScooterSpecification = {
  model: string;
  batteryCapacityAh: number | null;
  batteryCapacityWh: number | null;
  batteryType: "LI_ION" | "LFP";
  motorPowerW: number;
  topSpeedKmh: number;
  rangeKm: number;
  chargingTimeHours: number;
  brakingType: string | null;
  tyreType: string | null;
  tyreSize: string | null;
  suspension: string | null;
  kerbWeightKg: number | null;
  loadCapacityKg: number | null;
  seatHeightMm: number | null;
  groundClearanceMm: number | null;
  warrantyTerms: string | null;
  highlightFeatures: string[] | null;
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
  scooterSpec: ScooterSpecification | null;
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
  phone?: string | null;
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

// Account area (Phase 9): addresses, orders, returns

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type AddressInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
};

export type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

export type OrderItemView = {
  id: string;
  productId: string;
  variantId: string | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  totalAmount: number;
};

export type OrderStatusHistoryEntry = {
  id: string;
  status: OrderStatusValue;
  note: string | null;
  createdAt: string;
};

export type ShipmentStatusValue =
  | "PENDING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

export type ShipmentView = {
  status: ShipmentStatusValue;
  courierName: string | null;
  awbNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  expectedDeliveryAt: string | null;
  deliveredAt: string | null;
};

export type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

export type PaymentView = {
  status: PaymentStatusValue;
  amount: number;
  currency: string;
  paidAt: string | null;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  placedAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: OrderItemView[];
  statusHistory: OrderStatusHistoryEntry[];
  shippingAddress: Address;
  billingAddress: Address | null;
  payment: PaymentView | null;
  shipment: ShipmentView | null;
};

export type ReturnStatusValue = "REQUESTED" | "APPROVED" | "REJECTED" | "PICKED_UP" | "RECEIVED" | "COMPLETED";

export type ReturnView = {
  id: string;
  orderId: string;
  orderItemId: string | null;
  reason: string;
  status: ReturnStatusValue;
  adminNote: string | null;
  createdAt: string;
  order: { id: string; orderNumber: string };
  refund: { id: string; status: string; amount: number } | null;
};

export type CreateReturnInput = {
  orderId: string;
  orderItemId?: string;
  reason: string;
};

export type NotificationTypeValue = "ORDER" | "PAYMENT" | "SHIPMENT" | "RETURN" | "SYSTEM";

export type NotificationView = {
  id: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};
