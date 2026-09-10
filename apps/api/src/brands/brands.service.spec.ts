import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { NotFoundException } from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  brand: { findUnique: AsyncMock<Row | null>; create: AsyncMock<Row>; update: AsyncMock<Row> };
};

describe("BrandsService", () => {
  let service: BrandsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      brand: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(null),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "brand-1" }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "brand-1" }),
      },
    };
    service = new BrandsService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("slugifies the name when no slug is given", async () => {
      await service.create({ name: "Ather Energy" });
      expect(prisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: "ather-energy" }) }),
      );
    });

    it("appends a numeric suffix when the slug is already taken", async () => {
      prisma.brand.findUnique.mockResolvedValueOnce({ id: "existing" }).mockResolvedValueOnce(null);

      await service.create({ name: "Ather" });

      expect(prisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: "ather-2" }) }),
      );
    });
  });

  describe("update", () => {
    it("rejects when the brand being updated doesn't exist", async () => {
      prisma.brand.findUnique.mockResolvedValue(null);
      await expect(service.update("brand-1", { name: "New name" })).rejects.toThrow(NotFoundException);
    });
  });

  describe("archive", () => {
    it("deactivates rather than deletes", async () => {
      prisma.brand.findUnique.mockResolvedValue({ id: "brand-1" });
      await service.archive("brand-1");
      expect(prisma.brand.update).toHaveBeenCalledWith({ where: { id: "brand-1" }, data: { isActive: false } });
    });

    it("rejects archiving a brand that doesn't exist", async () => {
      prisma.brand.findUnique.mockResolvedValue(null);
      await expect(service.archive("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
