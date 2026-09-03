import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ProductsService } from "./products.service";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateProductDto } from "./dto/create-product.dto";

function baseDto(overrides: Partial<CreateProductDto> = {}): CreateProductDto {
  return {
    sku: "SKU-1",
    name: "Test Part",
    categoryId: "cat-1",
    price: 100,
    mrp: 200,
    ...overrides,
  };
}

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockTx = {
  product: {
    create: AsyncMock<Row>;
    findUniqueOrThrow: AsyncMock<Row>;
  };
  warehouse: { findUnique: AsyncMock<Row | null> };
  inventory: { create: AsyncMock<Row> };
  stockMovement: { create: AsyncMock<Row> };
};

type MockPrisma = {
  category: { findUnique: AsyncMock<Row | null> };
  brand: { findUnique: AsyncMock<Row | null> };
  product: {
    findUnique: AsyncMock<Row | null>;
    findUniqueOrThrow: AsyncMock<Row>;
    findMany: AsyncMock<Row[]>;
    count: AsyncMock<number>;
  };
  $transaction: Mock;
};

describe("ProductsService", () => {
  let service: ProductsService;
  let prisma: MockPrisma;
  let tx: MockTx;

  beforeEach(() => {
    tx = {
      product: {
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "prod-1" }),
        findUniqueOrThrow: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "prod-1", slug: "test-part" }),
      },
      warehouse: { findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "wh-1" }) },
      inventory: { create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "inv-1" }) },
      stockMovement: { create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "sm-1" }) },
    };

    prisma = {
      category: { findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "cat-1" }) },
      brand: { findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "brand-1" }) },
      product: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(null), // slug is free by default
        findUniqueOrThrow: jest.fn<AsyncFn<Row>>(),
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
        count: jest.fn<AsyncFn<number>>().mockResolvedValue(0),
      },
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: MockTx) => unknown)(tx),
      ),
    };

    service = new ProductsService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("rejects when price is greater than mrp, before touching the database", async () => {
      await expect(service.create(baseDto({ price: 500, mrp: 100 }))).rejects.toThrow(BadRequestException);
      expect(prisma.category.findUnique).not.toHaveBeenCalled();
    });

    it("rejects when categoryId does not reference an existing category", async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto())).rejects.toThrow(BadRequestException);
    });

    it("rejects when brandId does not reference an existing brand", async () => {
      prisma.brand.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto({ brandId: "brand-x" }))).rejects.toThrow(BadRequestException);
    });

    it("appends a numeric suffix when the generated slug is already taken", async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce({ id: "other" }) // "test-part" taken
        .mockResolvedValueOnce(null); // "test-part-2" free

      await service.create(baseDto());

      expect(tx.product.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: "test-part-2" }) }),
      );
    });

    it("creates an Inventory row seeded with initialStock and records a RESTOCK movement", async () => {
      await service.create(baseDto({ initialStock: 25 }));

      expect(tx.inventory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ currentStock: 25 }) }),
      );
      expect(tx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: "RESTOCK", quantity: 25 }) }),
      );
    });

    it("does not record a stock movement when initialStock is omitted", async () => {
      await service.create(baseDto());
      expect(tx.stockMovement.create).not.toHaveBeenCalled();
    });

    it("throws if the default warehouse has not been seeded", async () => {
      tx.warehouse.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto())).rejects.toThrow(/warehouse/i);
    });

    it("translates a duplicate SKU into a ConflictException", async () => {
      tx.product.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the constraint: `Product_sku_key`', {
          code: "P2002",
          clientVersion: "test",
        }),
      );
      await expect(service.create(baseDto())).rejects.toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("filters by categoryId when given", async () => {
      await service.findAll({ categoryId: "cat-1" });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ categoryId: "cat-1" }) }),
      );
    });

    it("filters by brandId when given", async () => {
      await service.findAll({ brandId: "brand-1" });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ brandId: "brand-1" }) }),
      );
    });

    it("does not filter by categoryId or brandId when omitted", async () => {
      await service.findAll({});
      const [[args]] = prisma.product.findMany.mock.calls as [[{ where: Record<string, unknown> }]];
      expect(args.where).not.toHaveProperty("categoryId");
      expect(args.where).not.toHaveProperty("brandId");
    });
  });

  describe("update", () => {
    it("rejects when the update would leave price greater than mrp", async () => {
      prisma.product.findUnique.mockResolvedValue({ id: "prod-1" }); // findOne existence check
      prisma.product.findUniqueOrThrow.mockResolvedValue({ id: "prod-1", price: 100, mrp: 200 });

      await expect(service.update("prod-1", { price: 250 })).rejects.toThrow(BadRequestException);
    });
  });
});
