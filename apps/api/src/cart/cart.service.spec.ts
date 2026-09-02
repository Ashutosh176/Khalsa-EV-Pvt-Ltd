import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CartService } from "./cart.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

function cartRow(items: Row[]): Row {
  return { id: "cart-1", userId: "user-1", items };
}

function cartItemRow(overrides: Partial<Row> = {}): Row {
  return {
    id: "item-1",
    productId: "prod-1",
    variantId: null,
    quantity: 2,
    savedForLater: false,
    product: {
      name: "Battery Pack",
      slug: "battery-pack",
      sku: "BATT-1",
      price: 1000,
      mrp: 1200,
      images: [{ url: "https://example.com/battery.jpg" }],
      inventory: [{ currentStock: 10, reservedStock: 0 }],
    },
    variant: null,
    ...overrides,
  };
}

type MockPrisma = {
  product: { findUnique: AsyncMock<Row | null> };
  productVariant: { findUnique: AsyncMock<Row | null> };
  cart: { findUnique: AsyncMock<Row | null>; create: AsyncMock<Row> };
  cartItem: {
    findFirst: AsyncMock<Row | null>;
    findUnique: AsyncMock<Row | null>;
    create: AsyncMock<Row>;
    update: AsyncMock<Row>;
    delete: AsyncMock<Row>;
  };
};

describe("CartService", () => {
  let service: CartService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      product: { findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "prod-1", status: "ACTIVE" }) },
      productVariant: { findUnique: jest.fn<AsyncFn<Row | null>>() },
      cart: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(cartRow([])),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue(cartRow([])),
      },
      cartItem: {
        findFirst: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(null),
        findUnique: jest.fn<AsyncFn<Row | null>>(),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "item-1" }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "item-1" }),
        delete: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "item-1" }),
      },
    };
    service = new CartService(prisma as unknown as PrismaService);
  });

  describe("addItem", () => {
    it("rejects a product that does not exist", async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.addItem("user-1", { productId: "prod-1", quantity: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects a product that is not ACTIVE", async () => {
      prisma.product.findUnique.mockResolvedValue({ id: "prod-1", status: "DRAFT" });
      await expect(service.addItem("user-1", { productId: "prod-1", quantity: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects a variantId that belongs to a different product", async () => {
      prisma.productVariant.findUnique.mockResolvedValue({ id: "var-1", productId: "other-product" });
      await expect(
        service.addItem("user-1", { productId: "prod-1", variantId: "var-1", quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("increments quantity instead of creating a duplicate row when the item is already in the cart", async () => {
      prisma.cartItem.findFirst.mockResolvedValue({ id: "existing-item", quantity: 2 });

      await service.addItem("user-1", { productId: "prod-1", quantity: 3 });

      expect(prisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ quantity: 5 }) }),
      );
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });

    it("un-saves an item for later when re-adding it to the cart", async () => {
      prisma.cartItem.findFirst.mockResolvedValue({ id: "existing-item", quantity: 1 });
      await service.addItem("user-1", { productId: "prod-1", quantity: 1 });
      expect(prisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ savedForLater: false }) }),
      );
    });
  });

  describe("getCart pricing", () => {
    it("computes lineTotal, subtotal, totalMrp, and totalSavings from live product prices", async () => {
      prisma.cart.findUnique.mockResolvedValue(cartRow([cartItemRow({ quantity: 2 })]));

      const cart = await service.getCart("user-1");

      expect(cart.items[0]?.unitPrice).toBe(1000);
      expect(cart.items[0]?.lineTotal).toBe(2000);
      expect(cart.subtotal).toBe(2000);
      expect(cart.totalMrp).toBe(2400);
      expect(cart.totalSavings).toBe(400);
      expect(cart.itemCount).toBe(2);
    });

    it("adds the variant's priceDelta on top of the base product price", async () => {
      prisma.cart.findUnique.mockResolvedValue(
        cartRow([cartItemRow({ quantity: 1, variant: { color: "Red", priceDelta: 150 } })]),
      );

      const cart = await service.getCart("user-1");

      expect(cart.items[0]?.unitPrice).toBe(1150);
    });

    it("excludes saved-for-later items from subtotal/itemCount but still lists them", async () => {
      prisma.cart.findUnique.mockResolvedValue(
        cartRow([cartItemRow({ id: "active-item" }), cartItemRow({ id: "saved-item", savedForLater: true })]),
      );

      const cart = await service.getCart("user-1");

      expect(cart.items).toHaveLength(2);
      expect(cart.itemCount).toBe(2); // only the active item's quantity (2)
      expect(cart.subtotal).toBe(2000); // only the active item
    });

    it("flags inStock: false when available stock is less than the requested quantity", async () => {
      prisma.cart.findUnique.mockResolvedValue(
        cartRow([
          cartItemRow({
            quantity: 5,
            product: {
              ...cartItemRow().product as Row,
              inventory: [{ currentStock: 3, reservedStock: 0 }],
            },
          }),
        ]),
      );

      const cart = await service.getCart("user-1");

      expect(cart.items[0]?.inStock).toBe(false);
    });
  });

  describe("ownership checks", () => {
    it("rejects updating an item that belongs to a different user's cart", async () => {
      prisma.cartItem.findUnique.mockResolvedValue({ id: "item-1", cart: { userId: "someone-else" } });
      await expect(service.updateItem("user-1", "item-1", { quantity: 2 })).rejects.toThrow(NotFoundException);
    });

    it("rejects removing an item that does not exist", async () => {
      prisma.cartItem.findUnique.mockResolvedValue(null);
      await expect(service.removeItem("user-1", "missing-item")).rejects.toThrow(NotFoundException);
    });
  });
});
