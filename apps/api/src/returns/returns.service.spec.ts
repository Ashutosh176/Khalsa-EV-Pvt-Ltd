import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { ReturnsService } from "./returns.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PaymentsService } from "../payments/payments.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  order: { findFirst: AsyncMock<Row | null> };
  return: { create: AsyncMock<Row>; findMany: AsyncMock<Row[]> };
};

describe("ReturnsService", () => {
  let service: ReturnsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      order: { findFirst: jest.fn<AsyncFn<Row | null>>() },
      return: {
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "ret-1" }),
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
      },
    };
    const notificationsService = { create: jest.fn() } as unknown as NotificationsService;
    const paymentsService = { refundForReturn: jest.fn() } as unknown as PaymentsService;
    service = new ReturnsService(prisma as unknown as PrismaService, notificationsService, paymentsService);
  });

  it("rejects a return request for an order that does not exist or isn't owned by the user", async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(
      service.create("user-1", { orderId: "order-1", reason: "Doesn't fit" }),
    ).rejects.toThrow(NotFoundException);
  });

  it("rejects a return request for an order that hasn't been delivered yet", async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: "order-1",
      status: OrderStatus.SHIPPED,
      items: [],
    });

    await expect(
      service.create("user-1", { orderId: "order-1", reason: "Doesn't fit" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects a return request for an item that doesn't belong to the order", async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: "order-1",
      status: OrderStatus.DELIVERED,
      items: [{ id: "item-1" }],
    });

    await expect(
      service.create("user-1", { orderId: "order-1", orderItemId: "item-99", reason: "Wrong item" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("creates a return request for a delivered order", async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: "order-1",
      status: OrderStatus.DELIVERED,
      items: [{ id: "item-1" }],
    });

    await service.create("user-1", { orderId: "order-1", orderItemId: "item-1", reason: "Doesn't fit" });

    expect(prisma.return.create).toHaveBeenCalledWith({
      data: {
        orderId: "order-1",
        orderItemId: "item-1",
        userId: "user-1",
        reason: "Doesn't fit",
      },
    });
  });

  it("lists returns scoped to the requesting user", async () => {
    await service.findAllForUser("user-1");

    expect(prisma.return.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });
});
