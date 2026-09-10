import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException } from "@nestjs/common";
import { CouponType } from "@prisma/client";
import { CouponsService } from "./coupons.service";
import { PrismaService } from "../prisma/prisma.service";
import type { CartService } from "../cart/cart.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

function couponRow(overrides: Partial<Row> = {}): Row {
  return {
    id: "coupon-1",
    code: "SAVE10",
    type: CouponType.PERCENTAGE,
    value: 10,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    usageLimit: null,
    usedCount: 0,
    isActive: true,
    startsAt: null,
    endsAt: null,
    ...overrides,
  };
}

type MockPrisma = {
  coupon: { findUnique: AsyncMock<Row | null>; create: AsyncMock<Row>; update: AsyncMock<Row> };
};

type MockTx = MockPrisma & { $executeRaw: (...args: unknown[]) => Promise<number> };

describe("CouponsService", () => {
  let service: CouponsService;
  let prisma: MockPrisma;
  let cartService: { getCart: AsyncMock<{ subtotal: number }> };

  beforeEach(() => {
    prisma = {
      coupon: {
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(couponRow()),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue(couponRow()),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue(couponRow()),
      },
    };
    cartService = { getCart: jest.fn<AsyncFn<{ subtotal: number }>>().mockResolvedValue({ subtotal: 100000 }) };
    service = new CouponsService(prisma as unknown as PrismaService, cartService as unknown as CartService);
  });

  describe("create", () => {
    it("uppercases the code", async () => {
      await service.create({ code: "save10", type: CouponType.PERCENTAGE, value: 10 });
      expect(prisma.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ code: "SAVE10" }) }),
      );
    });

    it("rejects a percentage coupon with a value over 100", async () => {
      await expect(service.create({ code: "BIG", type: CouponType.PERCENTAGE, value: 150 })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.coupon.create).not.toHaveBeenCalled();
    });

    it("allows a flat coupon value over 100 (it's paise, not a percent)", async () => {
      await service.create({ code: "FLAT500", type: CouponType.FLAT, value: 50000 });
      expect(prisma.coupon.create).toHaveBeenCalled();
    });
  });

  describe("previewForCart", () => {
    it("rejects an unknown or inactive coupon", async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.previewForCart("user-1", "MISSING")).rejects.toThrow(BadRequestException);
    });

    it("rejects when the cart subtotal is below minOrderAmount", async () => {
      prisma.coupon.findUnique.mockResolvedValue(couponRow({ minOrderAmount: 200000 }));
      await expect(service.previewForCart("user-1", "SAVE10")).rejects.toThrow(BadRequestException);
    });

    it("rejects an expired coupon", async () => {
      prisma.coupon.findUnique.mockResolvedValue(couponRow({ endsAt: new Date("2020-01-01") }));
      await expect(service.previewForCart("user-1", "SAVE10")).rejects.toThrow(BadRequestException);
    });

    it("rejects a coupon that has reached its usage limit", async () => {
      prisma.coupon.findUnique.mockResolvedValue(couponRow({ usageLimit: 5, usedCount: 5 }));
      await expect(service.previewForCart("user-1", "SAVE10")).rejects.toThrow(BadRequestException);
    });

    it("computes a percentage discount off the cart subtotal", async () => {
      const result = await service.previewForCart("user-1", "SAVE10");
      expect(result.discountAmount).toBe(10000); // 10% of 100000
    });

    it("caps a percentage discount at maxDiscountAmount", async () => {
      prisma.coupon.findUnique.mockResolvedValue(couponRow({ maxDiscountAmount: 5000 }));
      const result = await service.previewForCart("user-1", "SAVE10");
      expect(result.discountAmount).toBe(5000);
    });

    it("never discounts more than the subtotal for a flat coupon", async () => {
      cartService.getCart.mockResolvedValue({ subtotal: 300 });
      prisma.coupon.findUnique.mockResolvedValue(couponRow({ type: CouponType.FLAT, value: 50000 }));
      const result = await service.previewForCart("user-1", "FLAT500");
      expect(result.discountAmount).toBe(300);
    });
  });

  describe("applyToOrder", () => {
    function mockTx(executeRawResult: number): MockTx {
      return { ...prisma, $executeRaw: jest.fn<AsyncFn<number>>().mockResolvedValue(executeRawResult) as never };
    }

    it("claims one use and returns the discount", async () => {
      const tx = mockTx(1);
      const result = await service.applyToOrder(tx as never, "SAVE10", 100000);
      expect(result).toEqual({ couponId: "coupon-1", discountAmount: 10000 });
    });

    it("rejects when the atomic usage claim finds the coupon already exhausted", async () => {
      const tx = mockTx(0);
      await expect(service.applyToOrder(tx as never, "SAVE10", 100000)).rejects.toThrow(BadRequestException);
    });
  });

  describe("archive", () => {
    it("deactivates rather than deletes", async () => {
      await service.archive("coupon-1");
      expect(prisma.coupon.update).toHaveBeenCalledWith({ where: { id: "coupon-1" }, data: { isActive: false } });
    });
  });
});
