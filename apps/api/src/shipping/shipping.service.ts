import { Injectable } from "@nestjs/common";
import { OrderStatus, Prisma, ShipmentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdateShipmentDto } from "./dto/update-shipment.dto";

type TxClient = Prisma.TransactionClient;

// Order statuses that have a corresponding shipment stage. Statuses not
// listed here (PENDING, CONFIRMED, PROCESSING, CANCELLED) leave the
// Shipment row untouched - nothing has been handed to a courier yet.
const SHIPMENT_STATUS_BY_ORDER_STATUS: Partial<Record<OrderStatus, ShipmentStatus>> = {
  [OrderStatus.PACKED]: ShipmentStatus.PACKED,
  [OrderStatus.SHIPPED]: ShipmentStatus.SHIPPED,
  [OrderStatus.OUT_FOR_DELIVERY]: ShipmentStatus.OUT_FOR_DELIVERY,
  [OrderStatus.DELIVERED]: ShipmentStatus.DELIVERED,
  [OrderStatus.RETURNED]: ShipmentStatus.RETURNED,
};

// No live Shiprocket integration yet - no API credentials available
// (see docs/shipping.md). This is the interim manual provider: shipment
// status tracks the order lifecycle automatically via syncStatus(), and
// courier/AWB/tracking-URL are entered by an admin via updateTracking().
// A real ShiprocketService would expose the same two methods (plus
// actually calling the Shiprocket API for AWB generation) and swap in
// here without OrdersService changing at all.
@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async syncStatus(tx: TxClient, orderId: string, orderStatus: OrderStatus): Promise<void> {
    const shipmentStatus = SHIPMENT_STATUS_BY_ORDER_STATUS[orderStatus];
    if (!shipmentStatus) return;

    const timestamps: { shippedAt?: Date; deliveredAt?: Date } = {};
    if (shipmentStatus === ShipmentStatus.SHIPPED) timestamps.shippedAt = new Date();
    if (shipmentStatus === ShipmentStatus.DELIVERED) timestamps.deliveredAt = new Date();

    await tx.shipment.upsert({
      where: { orderId },
      create: { orderId, status: shipmentStatus, ...timestamps },
      update: { status: shipmentStatus, ...timestamps },
    });
  }

  updateTracking(orderId: string, dto: UpdateShipmentDto) {
    const data = {
      courierName: dto.courierName,
      awbNumber: dto.awbNumber,
      trackingUrl: dto.trackingUrl,
      expectedDeliveryAt: dto.expectedDeliveryAt ? new Date(dto.expectedDeliveryAt) : undefined,
    };

    return this.prisma.shipment.upsert({
      where: { orderId },
      create: { orderId, status: ShipmentStatus.PENDING, ...data },
      update: data,
    });
  }
}
