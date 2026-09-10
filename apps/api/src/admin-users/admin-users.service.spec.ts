import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { AdminUsersService } from "./admin-users.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

function uniqueEmailError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: ["email"] },
  });
}

type MockPrisma = {
  user: { findMany: AsyncMock<Row[]>; create: AsyncMock<Row>; update: AsyncMock<Row>; findUnique: AsyncMock<Row | null> };
};

describe("AdminUsersService", () => {
  let service: AdminUsersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
        create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "admin-2", role: Role.PRODUCT_MANAGER }),
        update: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "admin-2" }),
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue({ id: "admin-2", role: Role.PRODUCT_MANAGER }),
      },
    };
    service = new AdminUsersService(prisma as unknown as PrismaService);
  });

  describe("findAll", () => {
    it("scopes to accounts with a non-null role (admins, not customers)", async () => {
      await service.findAll();
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: { not: null } } }),
      );
    });
  });

  describe("create", () => {
    it("rejects a duplicate email with ConflictException", async () => {
      prisma.user.create.mockRejectedValue(uniqueEmailError());
      await expect(
        service.create({ email: "a@b.com", password: "password123", name: "A", role: Role.PRODUCT_MANAGER }),
      ).rejects.toThrow(ConflictException);
    });

    it("never returns the password hash", async () => {
      await service.create({ email: "a@b.com", password: "password123", name: "A", role: Role.PRODUCT_MANAGER });
      const call = prisma.user.create.mock.calls[0]?.[0] as { select?: Record<string, unknown> };
      expect(call?.select).not.toHaveProperty("passwordHash");
    });
  });

  describe("update", () => {
    it("rejects updating an account that doesn't exist or isn't an admin", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update("missing", { name: "X" }, "current-user")).rejects.toThrow(NotFoundException);
    });

    it("rejects deactivating your own account", async () => {
      await expect(service.update("admin-2", { isActive: false }, "admin-2")).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("rejects changing your own role", async () => {
      await expect(service.update("admin-2", { role: Role.SUPER_ADMIN }, "admin-2")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("allows deactivating a DIFFERENT admin's account", async () => {
      await service.update("admin-2", { isActive: false }, "admin-1");
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "admin-2" }, data: expect.objectContaining({ isActive: false }) }),
      );
    });

    it("allows changing your own name (only isActive/role are locked for self)", async () => {
      await service.update("admin-2", { name: "New Name" }, "admin-2");
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
