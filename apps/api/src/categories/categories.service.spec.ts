import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  category: { findUnique: AsyncMock<Row | null>; create: AsyncMock<Row>; update: AsyncMock<Row> };
};

describe("CategoriesService", () => {
  let service: CategoriesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      category: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(null),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "cat-1" }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "cat-1" }),
      },
    };
    service = new CategoriesService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("slugifies the name when no slug is given", async () => {
      await service.create({ name: "Batteries & Chargers" });
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: "batteries-chargers" }) }),
      );
    });

    it("appends a numeric suffix when the slug is already taken", async () => {
      prisma.category.findUnique.mockResolvedValueOnce({ id: "existing" }).mockResolvedValueOnce(null);

      await service.create({ name: "Batteries" });

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: "batteries-2" }) }),
      );
    });

    it("rejects when parentId does not reference an existing category", async () => {
      prisma.category.findUnique.mockResolvedValue(null); // requireCategory's check on parentId

      await expect(service.create({ name: "Batteries", parentId: "missing" })).rejects.toThrow(NotFoundException);
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("rejects when the category being updated doesn't exist", async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.update("cat-1", { name: "New name" })).rejects.toThrow(NotFoundException);
    });

    it("rejects a category being set as its own parent", async () => {
      prisma.category.findUnique.mockResolvedValue({ id: "cat-1" }); // requireCategory(id) passes
      await expect(service.update("cat-1", { parentId: "cat-1" })).rejects.toThrow(BadRequestException);
    });
  });

  describe("archive", () => {
    it("deactivates rather than deletes", async () => {
      prisma.category.findUnique.mockResolvedValue({ id: "cat-1" });
      await service.archive("cat-1");
      expect(prisma.category.update).toHaveBeenCalledWith({ where: { id: "cat-1" }, data: { isActive: false } });
    });

    it("rejects archiving a category that doesn't exist", async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.archive("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
