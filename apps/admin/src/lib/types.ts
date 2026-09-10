// Admin-only response shapes - not shared with apps/web, since these
// mirror admin-guarded endpoints the customer app never calls.

export type Role = "SUPER_ADMIN" | "PRODUCT_MANAGER" | "ORDER_MANAGER" | "INVENTORY_MANAGER" | "SUPPORT_MANAGER";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// The admin user *management* list (SUPER_ADMIN only) - a superset of
// AdminUser (isActive, createdAt) for accounts other than "me".
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type CreateAdminUserInput = { email: string; password: string; name: string; role: Role };
export type UpdateAdminUserInput = { name?: string; role?: Role; isActive?: boolean };

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  adminUser: { id: string; name: string; email: string };
};

export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type ProductType = "SPARE_PART" | "SCOOTER" | "ACCESSORY";

export type Category = { id: string; name: string; slug: string };
export type Brand = { id: string; name: string; slug: string };

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
};

export type CreateCategoryInput = { name: string; slug?: string; description?: string; imageUrl?: string; parentId?: string };
export type UpdateCategoryInput = Partial<CreateCategoryInput> & { isActive?: boolean };

export type CreateBrandInput = { name: string; slug?: string; logoUrl?: string; description?: string };
export type UpdateBrandInput = Partial<CreateBrandInput> & { isActive?: boolean };

export type CouponType = "PERCENTAGE" | "FLAT";

export type AdminCoupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

export type AdminOffer = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

export type CreateOfferInput = { title: string; description?: string; startsAt?: string; endsAt?: string };
export type UpdateOfferInput = Partial<CreateOfferInput> & { isActive?: boolean };

export type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  product: { id: string; name: string; slug: string };
};

export type CreateCouponInput = {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  startsAt?: string;
  endsAt?: string;
};
export type UpdateCouponInput = Partial<CreateCouponInput> & { isActive?: boolean };

export type ProductImage = { id: string; url: string; sortOrder: number };
export type InventoryRow = {
  id: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
};

export type BatteryType = "LI_ION" | "LFP";

// 1:1 with ScooterSpecification (apps/api/prisma/schema.prisma) - required
// fields here match that model's non-nullable columns.
export type ScooterSpecification = {
  brand?: string;
  model: string;
  variant?: string;
  batteryCapacityAh?: number;
  batteryCapacityWh?: number;
  batteryType: BatteryType;
  motorPowerW: number;
  topSpeedKmh: number;
  rangeKm: number;
  chargingTimeHours: number;
  brakingType?: string;
  tyreType?: string;
  tyreSize?: string;
  suspension?: string;
  kerbWeightKg?: number;
  loadCapacityKg?: number;
  seatHeightMm?: number;
  groundClearanceMm?: number;
  warrantyTerms?: string;
  highlightFeatures?: string[];
};

export type AdminProduct = {
  id: string;
  slug: string;
  sku: string;
  partNumber: string | null;
  name: string;
  description: string | null;
  productType: ProductType;
  status: ProductStatus;
  categoryId: string;
  brandId: string | null;
  price: number;
  mrp: number;
  gstPercent: string;
  warrantyMonths: number | null;
  isFeatured: boolean;
  category: Category;
  brand: Brand | null;
  images: ProductImage[];
  inventory: InventoryRow[];
  scooterSpec: ScooterSpecification | null;
};

export type CreateProductInput = {
  sku: string;
  name: string;
  categoryId: string;
  brandId?: string;
  partNumber?: string;
  description?: string;
  productType?: ProductType;
  price: number;
  mrp: number;
  gstPercent?: number;
  warrantyMonths?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  initialStock?: number;
  scooterSpec?: ScooterSpecification;
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, "initialStock">>;

export type PaginatedResult<T> = { items: T[]; total: number; page: number; pageSize: number };

export type OrderStatus =
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

export type OrderStatusHistoryEntry = { id: string; status: OrderStatus; note: string | null; createdAt: string };

export type OrderItemRow = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  totalAmount: number;
};

export type AddressRow = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  items: OrderItemRow[];
};

export type ShipmentStatus = "PENDING" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "RETURNED";

export type ShipmentInfo = {
  status: ShipmentStatus;
  courierName: string | null;
  awbNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  expectedDeliveryAt: string | null;
  deliveredAt: string | null;
};

export type UpdateShipmentInput = {
  courierName?: string;
  awbNumber?: string;
  trackingUrl?: string;
  expectedDeliveryAt?: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  cancellationReason: string | null;
  shippingAddress: AddressRow;
  billingAddress: AddressRow | null;
  statusHistory: OrderStatusHistoryEntry[];
  shipment: ShipmentInfo | null;
};

export type AdminInventoryItem = {
  id: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  availableStock: number;
  isLowStock: boolean;
  updatedAt: string;
  product: { id: string; name: string; sku: string; slug: string };
  variant: { id: string; sku: string; color: string | null } | null;
  warehouse: { id: string; name: string; code: string };
};

export type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PICKED_UP" | "RECEIVED" | "COMPLETED";
export type RefundStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type RefundInfo = {
  id: string;
  amount: number;
  status: RefundStatus;
  razorpayRefundId: string | null;
  processedAt: string | null;
};

export type AdminReturnListItem = {
  id: string;
  reason: string;
  status: ReturnStatus;
  adminNote: string | null;
  createdAt: string;
  order: { id: string; orderNumber: string };
  user: { id: string; name: string; email: string };
  refund: RefundInfo | null;
};

export type VehicleBrand = { id: string; name: string; slug: string };
export type VehicleModel = { id: string; vehicleBrandId: string; name: string; slug: string };
export type VehicleVariant = { id: string; vehicleModelId: string; name: string };

export type CompatibilityEntry = {
  id: string;
  vehicleVariant: { name: string; model: { name: string; brand: { name: string } } };
};
