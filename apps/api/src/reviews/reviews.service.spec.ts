import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ReviewsService } from "./reviews.service";
import { PrismaService } from "../prisma/prisma.service";
import type { NotificationsService } from "../notifications/notifications.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  orderItem: { findFirst: AsyncMock<Row | null> };
  review: {
    create: AsyncMock<Row>;
    findMany: AsyncMock<Row[]>;
    aggregate: AsyncMock<{ _avg: { rating: number | null }; _count: number }>;
    findUnique: AsyncMock<Row | null>;
    update: AsyncMock<Row>;
    delete: AsyncMock<Row>;
  };
  $transaction: AsyncMock<unknown[]>;
};

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: ["userId", "productId"] },
  });
}

describe("ReviewsService", () => {
  let service: ReviewsService;
  let prisma: MockPrisma;
  let notificationsService: { create: AsyncMock<Row> };

  beforeEach(() => {
    prisma = {
      orderItem: { findFirst: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "item-1" }) },
      review: {
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "review-1" }),
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
        aggregate: jest.fn<AsyncFn<{ _avg: { rating: number | null }; _count: number }>>(),
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "review-1", userId: "user-1" }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "review-1", userId: "user-1", isApproved: true }),
        delete: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "review-1" }),
      },
      $transaction: jest.fn<AsyncFn<unknown[]>>((arg: unknown) =>
        Promise.all(arg as unknown[] as Promise<unknown>[]),
      ) as unknown as AsyncMock<unknown[]>,
    };
    notificationsService = { create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "notif-1" }) };
    service = new ReviewsService(prisma as unknown as PrismaService, notificationsService as unknown as NotificationsService);
  });

  describe("create", () => {
    it("rejects a review for a product the user never had delivered", async () => {
      prisma.orderItem.findFirst.mockResolvedValue(null);
      await expect(service.create("user-1", { productId: "prod-1", rating: 5 })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it("creates a review (held for moderation) when the user has a delivered order for it", async () => {
      await service.create("user-1", { productId: "prod-1", rating: 4, comment: "Good product" });
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: { userId: "user-1", productId: "prod-1", rating: 4, title: undefined, comment: "Good product" },
      });
    });

    it("rejects a second review for the same product with ConflictException", async () => {
      prisma.review.create.mockRejectedValue(uniqueConstraintError());
      await expect(service.create("user-1", { productId: "prod-1", rating: 5 })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("findApprovedForProduct", () => {
    it("returns 0 average rating when there are no approved reviews", async () => {
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: 0 });
      const result = await service.findApprovedForProduct("prod-1");
      expect(result).toEqual({ items: [], averageRating: 0, totalCount: 0 });
    });

    it("returns the aggregate average and count alongside the reviews", async () => {
      prisma.review.findMany.mockResolvedValue([{ id: "review-1" }]);
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: 2 });
      const result = await service.findApprovedForProduct("prod-1");
      expect(result).toEqual({ items: [{ id: "review-1" }], averageRating: 4.5, totalCount: 2 });
    });
  });

  describe("approve", () => {
    it("rejects approving a review that doesn't exist", async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(service.approve("missing")).rejects.toThrow(NotFoundException);
    });

    it("marks the review approved and notifies its author", async () => {
      await service.approve("review-1");
      expect(prisma.review.update).toHaveBeenCalledWith({ where: { id: "review-1" }, data: { isApproved: true } });
      expect(notificationsService.create).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("rejects removing a review that doesn't exist", async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    });

    it("deletes the review outright (no reject-but-keep state exists)", async () => {
      await service.remove("review-1");
      expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: "review-1" } });
    });
  });
});
