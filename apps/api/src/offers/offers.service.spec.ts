import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { NotFoundException } from "@nestjs/common";
import { OffersService } from "./offers.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  offer: {
    findMany: AsyncMock<Row[]>;
    create: AsyncMock<Row>;
    update: AsyncMock<Row>;
    delete: AsyncMock<Row>;
    findUnique: AsyncMock<Row | null>;
  };
};

describe("OffersService", () => {
  let service: OffersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      offer: {
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "offer-1" }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "offer-1" }),
        delete: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "offer-1" }),
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "offer-1", imageUrl: null }),
      },
    };
    service = new OffersService(prisma as unknown as PrismaService);
  });

  describe("findAllActive", () => {
    it("filters to isActive and within the startsAt/endsAt window", async () => {
      await service.findAllActive();

      expect(prisma.offer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: expect.any(Date) } }] },
              { OR: [{ endsAt: null }, { endsAt: { gte: expect.any(Date) } }] },
            ],
          }),
        }),
      );
    });
  });

  describe("update", () => {
    it("rejects updating an offer that doesn't exist", async () => {
      prisma.offer.findUnique.mockResolvedValue(null);
      await expect(service.update("missing", { title: "New" })).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("rejects removing an offer that doesn't exist", async () => {
      prisma.offer.findUnique.mockResolvedValue(null);
      await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    });

    it("deletes the offer outright (no other table references it)", async () => {
      await service.remove("offer-1");
      expect(prisma.offer.delete).toHaveBeenCalledWith({ where: { id: "offer-1" } });
    });
  });

  describe("setImage", () => {
    it("rejects setting an image on an offer that doesn't exist", async () => {
      prisma.offer.findUnique.mockResolvedValue(null);
      await expect(
        service.setImage("missing", { filename: "a.png" } as Express.Multer.File),
      ).rejects.toThrow(NotFoundException);
    });

    it("stores the public URL for the uploaded file", async () => {
      await service.setImage("offer-1", { filename: "a.png" } as Express.Multer.File);
      expect(prisma.offer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "offer-1" },
          data: { imageUrl: expect.stringContaining("/uploads/offers/offer-1/a.png") },
        }),
      );
    });
  });
});
