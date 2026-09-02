// Admin-only response shapes - not shared with apps/web, since these
// mirror admin-guarded endpoints the customer app never calls.

export type Role = "SUPER_ADMIN" | "PRODUCT_MANAGER" | "ORDER_MANAGER" | "INVENTORY_MANAGER" | "SUPPORT_MANAGER";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type ProductType = "SPARE_PART" | "SCOOTER" | "ACCESSORY";

export type Category = { id: string; name: string; slug: string };
export type Brand = { id: string; name: string; slug: string };

export type ProductImage = { id: string; url: string; sortOrder: number };
export type InventoryRow = {
  id: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
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
};

export type CreateProductInput = {
  sku: string;
  name: string;
  categoryId: string;
  brandId?: string;
  partNumber?: string;
  description?: string;
  price: number;
  mrp: number;
  gstPercent?: number;
  warrantyMonths?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  initialStock?: number;
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

export type VehicleBrand = { id: string; name: string; slug: string };
export type VehicleModel = { id: string; vehicleBrandId: string; name: string; slug: string };
export type VehicleVariant = { id: string; vehicleModelId: string; name: string };

export type CompatibilityEntry = {
  id: string;
  vehicleVariant: { name: string; model: { name: string; brand: { name: string } } };
};
