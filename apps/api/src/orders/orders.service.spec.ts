import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../prisma/prisma.service";
import { FLAT_SHIPPING_FEE_PAISE, FREE_SHIPPING_THRESHOLD_PAISE } from "../common/constants";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

function cartItemRow(overrides: Partial<Row> = {}): Row {
  return {
    id: "cart-item-1",
    productId: "prod-1",
    variantId: null,
    quantity: 1,
    product: { id: "prod-1", name: "Battery Pack", sku: "BATT-1", price: 100000, mrp: 120000, gstPercent: 18, status: "ACTIVE" },
    variant: null,
    ...overrides,
  };
}

type MockTx = {
  order: { create: AsyncMock<Row>; update: AsyncMock<Row> };
  orderItem: { create: AsyncMock<Row> };
  inventory: { findFirst: AsyncMock<Row | null>; update: AsyncMock<Row> };
  stockMovement: { create: AsyncMock<Row> };
  orderStatusHistory: { create: AsyncMock<Row> };
  $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
};

type MockPrisma = {
  address: { findUnique: AsyncMock<Row | null> };
  cart: { findUnique: AsyncMock<Row | null> };
  order: { findUnique: AsyncMock<Row | null> };
  $transaction: Mock;
};

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: MockPrisma;
  let tx: MockTx;
  let executeRawResult: number;

  beforeEach(() => {
    executeRawResult = 1; // reservation succeeds by default

    tx = {
      order: {
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "order-1" }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "order-1" }),
      },
      orderItem: { create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "item-1" }) },
      inventory: {
        findFirst: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "inv-1" }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "inv-1" }),
      },
      stockMovement: { create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "sm-1" }) },
      orderStatusHistory: { create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "hist-1" }) },
      $executeRaw: (() => Promise.resolve(executeRawResult)) as MockTx["$executeRaw"],
    };

    prisma = {
      address: { findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "addr-1", userId: "user-1" }) },
      cart: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "cart-1", items: [cartItemRow()] }),
      },
      order: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({
          id: "order-1",
          userId: "user-1",
          status: "PENDING",
          items: [cartItemRow()],
        }),
      },
      $transaction: jest.fn((arg: unknown) => (typeof arg === "function" ? arg(tx) : Promise.resolve(arg))),
    };

    service = new OrdersService(prisma as unknown as PrismaService);
  });

  describe("createFromCart", () => {
    it("rejects when the shipping address does not belong to the user", async () => {
      prisma.address.findUnique.mockResolvedValue({ id: "addr-1", userId: "someone-else" });
      await expect(service.createFromCart("user-1", { shippingAddressId: "addr-1" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects an empty cart", async () => {
      prisma.cart.findUnique.mockResolvedValue({ id: "cart-1", items: [] });
      await expect(service.createFromCart("user-1", { shippingAddressId: "addr-1" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects when a cart item's product is no longer ACTIVE", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart-1",
        items: [cartItemRow({ product: { ...cartItemRow().product as Row, status: "INACTIVE" } })],
      });
      await expect(service.createFromCart("user-1", { shippingAddressId: "addr-1" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("computes subtotal, flat shipping (below free-shipping threshold), and GST-inclusive tax", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart-1",
        items: [cartItemRow({ quantity: 2 })], // 2 x 100000 = 200000, below free-shipping threshold
      });

      await service.createFromCart("user-1", { shippingAddressId: "addr-1" });

      expect(tx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 200000,
            shippingAmount: FLAT_SHIPPING_FEE_PAISE,
            taxAmount: Math.round((200000 * 18) / 118), // reverse-GST extraction
            totalAmount: 200000 + FLAT_SHIPPING_FEE_PAISE,
          }),
        }),
      );
    });

    it("waives shipping at/above the free-shipping threshold", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: "cart-1",
        items: [cartItemRow({ quantity: 1, product: { ...cartItemRow().product as Row, price: FREE_SHIPPING_THRESHOLD_PAISE } })],
      });

      await service.createFromCart("user-1", { shippingAddressId: "addr-1" });

      expect(tx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ shippingAmount: 0 }) }),
      );
    });

    it("rejects with ConflictException when the atomic stock reservation fails (race lost)", async () => {
      executeRawResult = 0; // WHERE clause matched 0 rows: insufficient stock
      await expect(service.createFromCart("user-1", { shippingAddressId: "addr-1" })).rejects.toThrow(
        ConflictException,
      );
    });

    it("does not reserve any stock when there is no Inventory row for the product", async () => {
      tx.inventory.findFirst.mockResolvedValue(null);
      await expect(service.createFromCart("user-1", { shippingAddressId: "addr-1" })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("cancel", () => {
    it("rejects cancelling an order that is not PENDING", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: "order-1", userId: "user-1", status: "CONFIRMED", items: [] });
      await expect(service.cancel("user-1", "order-1")).rejects.toThrow(BadRequestException);
    });

    it("releases reserved stock for every item when cancelling a PENDING order", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        userId: "user-1",
        status: "PENDING",
        items: [cartItemRow({ quantity: 3 })],
      });

      await service.cancel("user-1", "order-1", "Changed my mind");

      expect(tx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { reservedStock: { decrement: 3 } } }),
      );
      expect(tx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: "RELEASE", quantity: 3 }) }),
      );
    });
  });
});
