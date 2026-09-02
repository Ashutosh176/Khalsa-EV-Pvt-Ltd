import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { PrismaService } from "../prisma/prisma.service";
import { CartService } from "../cart/cart.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

function wishlistRow(items: Row[]): Row {
  return { id: "wishlist-1", userId: "user-1", items };
}

function wishlistItemRow(overrides: Partial<Row> = {}): Row {
  return {
    id: "item-1",
    productId: "prod-1",
    product: {
      name: "Battery Pack",
      slug: "battery-pack",
      sku: "BATT-1",
      price: 1000,
      mrp: 1200,
      images: [{ url: "https://example.com/battery.jpg" }],
      inventory: [{ currentStock: 5, reservedStock: 0 }],
    },
    ...overrides,
  };
}

type MockPrisma = {
  product: { findUnique: AsyncMock<Row | null> };
  wishlist: { findUnique: AsyncMock<Row | null>; create: AsyncMock<Row> };
  wishlistItem: {
    findUnique: AsyncMock<Row | null>;
    create: AsyncMock<Row>;
    delete: AsyncMock<Row>;
  };
};

describe("WishlistService", () => {
  let service: WishlistService;
  let prisma: MockPrisma;
  let cartService: { addItem: AsyncMock<Row> };

  beforeEach(() => {
    prisma = {
      product: { findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "prod-1", status: "ACTIVE" }) },
      wishlist: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(wishlistRow([])),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue(wishlistRow([])),
      },
      wishlistItem: {
        findUnique: jest.fn<AsyncFn<Row | null>>(),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "item-1" }),
        delete: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "item-1" }),
      },
    };
    cartService = { addItem: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "cart-1" }) };
    service = new WishlistService(prisma as unknown as PrismaService, cartService as unknown as CartService);
  });

  describe("addItem", () => {
    it("rejects a product that does not exist or is unavailable", async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.addItem("user-1", { productId: "prod-1" })).rejects.toThrow(BadRequestException);
    });

    it("does not create a duplicate row when the product is already wishlisted", async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue({ id: "already-there" });

      await service.addItem("user-1", { productId: "prod-1" });

      expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
    });

    it("creates the item when it is not already wishlisted", async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue(null);
      await service.addItem("user-1", { productId: "prod-1" });
      expect(prisma.wishlistItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ productId: "prod-1" }) }),
      );
    });
  });

  describe("getWishlist", () => {
    it("computes inStock from live inventory rather than trusting a stored flag", async () => {
      prisma.wishlist.findUnique.mockResolvedValue(
        wishlistRow([
          wishlistItemRow({
            product: { ...wishlistItemRow().product as Row, inventory: [{ currentStock: 0, reservedStock: 0 }] },
          }),
        ]),
      );

      const items = await service.getWishlist("user-1");

      expect(items[0]?.product.inStock).toBe(false);
    });
  });

  describe("ownership checks", () => {
    it("rejects removing an item belonging to a different user", async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue({ id: "item-1", wishlist: { userId: "someone-else" } });
      await expect(service.removeItem("user-1", "item-1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("moveToCart", () => {
    it("adds the product to the cart and removes it from the wishlist", async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue({
        id: "item-1",
        productId: "prod-1",
        wishlist: { userId: "user-1" },
      });

      await service.moveToCart("user-1", "item-1");

      expect(cartService.addItem).toHaveBeenCalledWith("user-1", { productId: "prod-1", quantity: 1 });
      expect(prisma.wishlistItem.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
    });

    it("rejects moving an item that does not belong to the user", async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue({ id: "item-1", wishlist: { userId: "someone-else" } });
      await expect(service.moveToCart("user-1", "item-1")).rejects.toThrow(NotFoundException);
      expect(cartService.addItem).not.toHaveBeenCalled();
    });
  });
});
