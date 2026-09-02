import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException } from "@nestjs/common";
import { VehiclesService } from "./vehicles.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  vehicleBrand: { findUnique: AsyncMock<Row | null>; create: AsyncMock<Row> };
  vehicleModel: { findFirst: AsyncMock<Row | null>; create: AsyncMock<Row> };
};

describe("VehiclesService", () => {
  let service: VehiclesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      vehicleBrand: {
        // First call: "does the slug already exist" (null = free).
        // Overridden per-test where a brand-existence check is needed.
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(null),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "brand-1" }),
      },
      vehicleModel: {
        findFirst: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(null),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "model-1" }),
      },
    };
    service = new VehiclesService(prisma as unknown as PrismaService);
  });

  describe("createBrand", () => {
    it("slugifies the name when no slug is given", async () => {
      await service.createBrand({ name: "Ather Energy" });
      expect(prisma.vehicleBrand.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: "ather-energy" }) }),
      );
    });

    it("appends a numeric suffix when the slug is already taken", async () => {
      prisma.vehicleBrand.findUnique
        .mockResolvedValueOnce({ id: "existing" }) // "ather" taken
        .mockResolvedValueOnce(null); // "ather-2" free

      await service.createBrand({ name: "Ather" });

      expect(prisma.vehicleBrand.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: "ather-2" }) }),
      );
    });
  });

  describe("createModel", () => {
    it("rejects when vehicleBrandId does not reference an existing brand", async () => {
      prisma.vehicleBrand.findUnique.mockResolvedValue(null); // requireBrand's check
      await expect(service.createModel({ vehicleBrandId: "brand-1", name: "450X" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("scopes slug uniqueness to the brand, not globally", async () => {
      prisma.vehicleBrand.findUnique.mockResolvedValue({ id: "brand-1" }); // requireBrand passes
      await service.createModel({ vehicleBrandId: "brand-1", name: "450X" });
      expect(prisma.vehicleModel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ vehicleBrandId: "brand-1", slug: "450x" }) }),
      );
    });
  });
});
