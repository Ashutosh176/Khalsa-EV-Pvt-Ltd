import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException } from "@nestjs/common";
import { PaymentStatus, RefundStatus } from "@prisma/client";
import { PaymentsService } from "./payments.service";
import { PrismaService } from "../prisma/prisma.service";
import type { RazorpayClient } from "./razorpay.client";
import type { NotificationsService } from "../notifications/notifications.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  payment: { findUnique: AsyncMock<Row | null> };
  refund: { findUnique: AsyncMock<Row | null>; findFirst: AsyncMock<Row | null>; create: AsyncMock<Row>; update: AsyncMock<Row> };
};

describe("PaymentsService.refundForReturn", () => {
  let service: PaymentsService;
  let prisma: MockPrisma;
  let razorpay: { createRefund: AsyncMock<Row> };

  beforeEach(() => {
    prisma = {
      payment: { findUnique: jest.fn<AsyncFn<Row | null>>() },
      refund: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(null),
        findFirst: jest.fn<AsyncFn<Row | null>>(),
        create: jest.fn<AsyncFn<Row>>(),
        update: jest.fn<AsyncFn<Row>>(),
      },
    };
    razorpay = { createRefund: jest.fn<AsyncFn<Row>>() };
    const notificationsService = { create: jest.fn() } as unknown as NotificationsService;
    service = new PaymentsService(prisma as unknown as PrismaService, razorpay as unknown as RazorpayClient, notificationsService);
  });

  it("returns the existing refund without calling Razorpay again if one already exists", async () => {
    const existing = { id: "refund-1" };
    prisma.refund.findUnique.mockResolvedValue(existing);

    const result = await service.refundForReturn("return-1", "order-1", 10000);

    expect(result).toBe(existing);
    expect(razorpay.createRefund).not.toHaveBeenCalled();
  });

  it("rejects a refund for an order with no captured payment", async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    await expect(service.refundForReturn("return-1", "order-1", 10000)).rejects.toThrow(BadRequestException);
    expect(razorpay.createRefund).not.toHaveBeenCalled();
  });

  it("rejects a refund for a payment that hasn't been captured yet", async () => {
    prisma.payment.findUnique.mockResolvedValue({ id: "pay-1", status: PaymentStatus.PENDING, razorpayPaymentId: null });

    await expect(service.refundForReturn("return-1", "order-1", 10000)).rejects.toThrow(BadRequestException);
  });

  it("creates a COMPLETED refund when Razorpay processes it immediately", async () => {
    prisma.payment.findUnique.mockResolvedValue({ id: "pay-1", status: PaymentStatus.PAID, razorpayPaymentId: "pay_rzp_1" });
    razorpay.createRefund.mockResolvedValue({ id: "rfnd_1", status: "processed" });

    await service.refundForReturn("return-1", "order-1", 10000);

    expect(razorpay.createRefund).toHaveBeenCalledWith("pay_rzp_1", 10000, { returnId: "return-1" });
    expect(prisma.refund.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RefundStatus.COMPLETED, razorpayRefundId: "rfnd_1" }),
      }),
    );
  });

  it("creates a PROCESSING refund when Razorpay hasn't settled it yet", async () => {
    prisma.payment.findUnique.mockResolvedValue({ id: "pay-1", status: PaymentStatus.PAID, razorpayPaymentId: "pay_rzp_1" });
    razorpay.createRefund.mockResolvedValue({ id: "rfnd_1", status: "pending" });

    await service.refundForReturn("return-1", "order-1", 10000);

    expect(prisma.refund.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RefundStatus.PROCESSING, processedAt: null }),
      }),
    );
  });
});

describe("PaymentsService refund webhook handling", () => {
  let service: PaymentsService;
  let prisma: MockPrisma;
  let razorpay: { verifyWebhookSignature: Mock<(...args: unknown[]) => boolean> };

  beforeEach(() => {
    prisma = {
      payment: { findUnique: jest.fn<AsyncFn<Row | null>>() },
      refund: {
        findUnique: jest.fn<AsyncFn<Row | null>>(),
        findFirst: jest.fn<AsyncFn<Row | null>>(),
        create: jest.fn<AsyncFn<Row>>(),
        update: jest.fn<AsyncFn<Row>>(),
      },
    };
    razorpay = { verifyWebhookSignature: jest.fn(() => true) };
    const notificationsService = { create: jest.fn() } as unknown as NotificationsService;
    service = new PaymentsService(prisma as unknown as PrismaService, razorpay as unknown as RazorpayClient, notificationsService);
  });

  function webhookBody(event: string, refundId: string) {
    return Buffer.from(JSON.stringify({ event, payload: { refund: { entity: { id: refundId } } } }));
  }

  it("marks a refund COMPLETED on refund.processed", async () => {
    prisma.refund.findFirst.mockResolvedValue({ id: "refund-1", status: RefundStatus.PROCESSING });

    await service.handleWebhook(webhookBody("refund.processed", "rfnd_1"), "sig");

    expect(prisma.refund.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "refund-1" }, data: expect.objectContaining({ status: RefundStatus.COMPLETED }) }),
    );
  });

  it("marks a refund FAILED on refund.failed", async () => {
    prisma.refund.findFirst.mockResolvedValue({ id: "refund-1", status: RefundStatus.PROCESSING });

    await service.handleWebhook(webhookBody("refund.failed", "rfnd_1"), "sig");

    expect(prisma.refund.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "refund-1" }, data: expect.objectContaining({ status: RefundStatus.FAILED }) }),
    );
  });

  it("ignores a refund webhook for an unknown refund id", async () => {
    prisma.refund.findFirst.mockResolvedValue(null);

    await service.handleWebhook(webhookBody("refund.processed", "rfnd_unknown"), "sig");

    expect(prisma.refund.update).not.toHaveBeenCalled();
  });
});
