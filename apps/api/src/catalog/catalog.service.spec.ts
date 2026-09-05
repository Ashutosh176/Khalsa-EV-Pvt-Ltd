import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { NotFoundException } from "@nestjs/common";
import { ProductType } from "@prisma/client";
import { CatalogService } from "./catalog.service";
import { PrismaService } from "../prisma/prisma.service";

type InventoryRow = { currentStock: number; reservedStock: number };
type ProductRow = { id: string; inventory: InventoryRow[]; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  product: {
    findFirst: AsyncMock<ProductRow | null>;
    findMany: AsyncMock<ProductRow[]>;
    count: AsyncMock<number>;
  };
  $transaction: Mock;
};

describe("CatalogService", () => {
  let service: CatalogService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      product: {
        findFirst: jest.fn<AsyncFn<ProductRow | null>>(),
        findMany: jest.fn<AsyncFn<ProductRow[]>>().mockResolvedValue([]),
        count: jest.fn<AsyncFn<number>>().mockResolvedValue(0),
      },
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : Promise.resolve(arg),
      ),
    };
    service = new CatalogService(prisma as unknown as PrismaService);
  });

  describe("findBySlug", () => {
    it("throws NotFoundException when no active product matches the slug", async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug("missing")).rejects.toThrow(NotFoundException);
    });

    it("reports inStock: true when available stock (current - reserved) across all rows is positive", async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: "prod-1",
        inventory: [{ currentStock: 10, reservedStock: 3 }],
      });
      const result = await service.findBySlug("battery-pack");
      expect(result.inStock).toBe(true);
      expect(result.availableStock).toBe(7);
    });

    it("reports inStock: false when reserved stock consumes all current stock", async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: "prod-1",
        inventory: [{ currentStock: 5, reservedStock: 5 }],
      });
      const result = await service.findBySlug("battery-pack");
      expect(result.inStock).toBe(false);
      expect(result.availableStock).toBe(0);
    });

    it("sums stock across multiple warehouse rows and never leaks the raw inventory array", async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: "prod-1",
        inventory: [
          { currentStock: 10, reservedStock: 2 },
          { currentStock: 4, reservedStock: 1 },
        ],
      });
      const result = await service.findBySlug("battery-pack");
      expect(result.availableStock).toBe(11);
      expect(result).not.toHaveProperty("inventory");
    });
  });

  describe("findAll", () => {
    it("only ever queries ACTIVE products, regardless of what the caller asks for", async () => {
      await service.findAll({});
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: "ACTIVE" }) }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: "ACTIVE" }) }),
      );
    });

    it("filters by vehicleVariantId via a compatibility relation, when given", async () => {
      await service.findAll({ vehicleVariantId: "variant-1" });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            compatibility: { some: { vehicleVariantId: "variant-1" } },
          }),
        }),
      );
    });

    it("filters by productType, when given", async () => {
      await service.findAll({ productType: ProductType.SCOOTER });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ productType: ProductType.SCOOTER }) }),
      );
    });

    it("filters to isFeatured: true when featured is requested", async () => {
      await service.findAll({ featured: true });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isFeatured: true }) }),
      );
    });

    it("does not filter by isFeatured when featured is omitted or false", async () => {
      await service.findAll({ featured: false });
      const [[args]] = prisma.product.findMany.mock.calls as [[{ where: Record<string, unknown> }]];
      expect(args.where).not.toHaveProperty("isFeatured");
    });
  });
});
