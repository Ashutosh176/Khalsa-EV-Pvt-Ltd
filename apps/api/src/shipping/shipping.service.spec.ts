import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { OrderStatus } from "@prisma/client";
import { ShippingService } from "./shipping.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockTx = { shipment: { upsert: AsyncMock<Row> } };
type MockPrisma = { shipment: { upsert: AsyncMock<Row> } };

describe("ShippingService", () => {
  let service: ShippingService;
  let prisma: MockPrisma;
  let tx: MockTx;

  beforeEach(() => {
    prisma = { shipment: { upsert: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "ship-1" }) } };
    tx = { shipment: { upsert: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "ship-1" }) } };
    service = new ShippingService(prisma as unknown as PrismaService);
  });

  describe("syncStatus", () => {
    it("does nothing for an order status with no shipment stage (e.g. CONFIRMED)", async () => {
      await service.syncStatus(tx as never, "order-1", OrderStatus.CONFIRMED);
      expect(tx.shipment.upsert).not.toHaveBeenCalled();
    });

    it("upserts PACKED without touching shippedAt/deliveredAt", async () => {
      await service.syncStatus(tx as never, "order-1", OrderStatus.PACKED);
      expect(tx.shipment.upsert).toHaveBeenCalledWith({
        where: { orderId: "order-1" },
        create: { orderId: "order-1", status: "PACKED" },
        update: { status: "PACKED" },
      });
    });

    it("stamps shippedAt when transitioning to SHIPPED", async () => {
      await service.syncStatus(tx as never, "order-1", OrderStatus.SHIPPED);
      const [[args]] = tx.shipment.upsert.mock.calls as [[{ update: { shippedAt?: Date } }]];
      expect(args.update.shippedAt).toBeInstanceOf(Date);
    });

    it("stamps deliveredAt when transitioning to DELIVERED", async () => {
      await service.syncStatus(tx as never, "order-1", OrderStatus.DELIVERED);
      const [[args]] = tx.shipment.upsert.mock.calls as [[{ update: { deliveredAt?: Date } }]];
      expect(args.update.deliveredAt).toBeInstanceOf(Date);
    });
  });

  describe("updateTracking", () => {
    it("upserts the courier/AWB/tracking fields an admin provides", async () => {
      await service.updateTracking("order-1", { courierName: "Delhivery", awbNumber: "AWB123" });

      expect(prisma.shipment.upsert).toHaveBeenCalledWith({
        where: { orderId: "order-1" },
        create: {
          orderId: "order-1",
          status: "PENDING",
          courierName: "Delhivery",
          awbNumber: "AWB123",
          trackingUrl: undefined,
          expectedDeliveryAt: undefined,
        },
        update: {
          courierName: "Delhivery",
          awbNumber: "AWB123",
          trackingUrl: undefined,
          expectedDeliveryAt: undefined,
        },
      });
    });

    it("converts expectedDeliveryAt to a Date", async () => {
      await service.updateTracking("order-1", { expectedDeliveryAt: "2026-09-10T00:00:00.000Z" });
      const [[args]] = prisma.shipment.upsert.mock.calls as [[{ update: { expectedDeliveryAt?: Date } }]];
      expect(args.update.expectedDeliveryAt).toBeInstanceOf(Date);
    });
  });
});
