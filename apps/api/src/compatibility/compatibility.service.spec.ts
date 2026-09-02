import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CompatibilityService } from "./compatibility.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  product: { findUnique: AsyncMock<Row | null> };
  vehicleVariant: { findUnique: AsyncMock<Row | null>; findMany: AsyncMock<Row[]> };
  productCompatibility: {
    create: AsyncMock<Row>;
    createMany: AsyncMock<{ count: number }>;
    findUnique: AsyncMock<Row | null>;
    delete: AsyncMock<Row>;
  };
};

describe("CompatibilityService", () => {
  let service: CompatibilityService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      product: { findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "prod-1" }) },
      vehicleVariant: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "variant-1" }),
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([{ id: "variant-1" }]),
      },
      productCompatibility: {
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "map-1" }),
        createMany: jest.fn<AsyncFn<{ count: number }>>().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "map-1" }),
        delete: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "map-1" }),
      },
    };
    service = new CompatibilityService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("rejects when productId does not reference an existing product", async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ productId: "prod-1", vehicleVariantId: "variant-1" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects when vehicleVariantId does not reference an existing variant", async () => {
      prisma.vehicleVariant.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ productId: "prod-1", vehicleVariantId: "variant-1" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("translates a duplicate-mapping unique-constraint violation into a ConflictException", async () => {
      prisma.productCompatibility.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'unique constraint failed: "ProductCompatibility_product_variant_no_year_unique"',
          { code: "P2002", clientVersion: "test" },
        ),
      );
      await expect(
        service.create({ productId: "prod-1", vehicleVariantId: "variant-1" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("bulkCreate", () => {
    it("rejects when any vehicleVariantId in the batch is unknown", async () => {
      prisma.vehicleVariant.findMany.mockResolvedValue([{ id: "variant-1" }]); // "variant-2" missing
      await expect(
        service.bulkCreate({ productId: "prod-1", vehicleVariantIds: ["variant-1", "variant-2"] }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.productCompatibility.createMany).not.toHaveBeenCalled();
    });

    it("uses skipDuplicates so re-running a bulk map is a safe no-op", async () => {
      await service.bulkCreate({ productId: "prod-1", vehicleVariantIds: ["variant-1"] });
      expect(prisma.productCompatibility.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
    });
  });

  describe("findAll", () => {
    it("requires at least one filter", () => {
      expect(() => service.findAll({})).toThrow(BadRequestException);
    });
  });
});
