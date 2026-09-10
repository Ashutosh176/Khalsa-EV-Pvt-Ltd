import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { AuditLogService } from "./audit-log.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

type MockPrisma = {
  adminAuditLog: { create: AsyncMock<Row>; findMany: AsyncMock<Row[]>; count: AsyncMock<number> };
  $transaction: AsyncMock<unknown[]>;
};

describe("AuditLogService", () => {
  let service: AuditLogService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      adminAuditLog: {
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "log-1" }),
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
        count: jest.fn<AsyncFn<number>>().mockResolvedValue(0),
      },
      $transaction: jest.fn((arg: unknown) =>
        Promise.all(arg as Promise<unknown>[]),
      ) as unknown as AsyncMock<unknown[]>,
    };
    service = new AuditLogService(prisma as unknown as PrismaService);
  });

  describe("log", () => {
    it("writes an entry with the given fields", async () => {
      await service.log({ adminUserId: "admin-1", action: "Coupons.create", entityType: "Coupons", entityId: "c-1" });
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: { adminUserId: "admin-1", action: "Coupons.create", entityType: "Coupons", entityId: "c-1", metadata: undefined },
      });
    });

    it("swallows a write failure rather than throwing (best-effort)", async () => {
      prisma.adminAuditLog.create.mockRejectedValue(new Error("db down"));
      await expect(
        service.log({ adminUserId: "admin-1", action: "Coupons.create", entityType: "Coupons" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("findAll", () => {
    it("filters by adminUserId and entityType when given", async () => {
      await service.findAll({ adminUserId: "admin-1", entityType: "Coupons" });
      expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { adminUserId: "admin-1", entityType: "Coupons" } }),
      );
    });

    it("applies no filter when none are given", async () => {
      await service.findAll({});
      expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });
});
