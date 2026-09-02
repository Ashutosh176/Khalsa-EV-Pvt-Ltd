import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash } from "bcrypt";
import { Role } from "@prisma/client";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

type AdminRow = { id: string; email: string; role: Role | null; isActive: boolean; passwordHash: string };

describe("AuthService", () => {
  let service: AuthService;
  let prisma: { user: { findUnique: Mock<() => Promise<AdminRow | null>> } };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    prisma = { user: { findUnique: jest.fn() } };
    service = new AuthService(prisma as unknown as PrismaService, new JwtService());
  });

  describe("validateAdmin", () => {
    it("rejects an unknown email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.validateAdmin("nobody@khalsaev.com", "password123")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects a customer account (role is null)", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "customer@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: await hash("password123", 4),
      });
      await expect(service.validateAdmin("customer@khalsaev.com", "password123")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects a deactivated admin account", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "admin@khalsaev.com",
        role: Role.SUPER_ADMIN,
        isActive: false,
        passwordHash: await hash("password123", 4),
      });
      await expect(service.validateAdmin("admin@khalsaev.com", "password123")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects a wrong password", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "admin@khalsaev.com",
        role: Role.SUPER_ADMIN,
        isActive: true,
        passwordHash: await hash("correct-password", 4),
      });
      await expect(service.validateAdmin("admin@khalsaev.com", "wrong-password")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("accepts a valid active admin with the correct password", async () => {
      const user = {
        id: "u1",
        email: "admin@khalsaev.com",
        role: Role.SUPER_ADMIN,
        isActive: true,
        passwordHash: await hash("correct-password", 4),
      };
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(service.validateAdmin("admin@khalsaev.com", "correct-password")).resolves.toEqual(user);
    });
  });

  describe("token issuance", () => {
    it("issues an access token that verifies with the access secret", () => {
      const payload = { sub: "u1", email: "admin@khalsaev.com", role: Role.SUPER_ADMIN };
      const token = service.issueAccessToken(payload);
      const jwt = new JwtService();
      expect(jwt.verify(token, { secret: "test-access-secret" })).toMatchObject(payload);
    });

    it("rejects an expired/invalid refresh token", () => {
      expect(() => service.verifyRefreshToken("not-a-real-token")).toThrow(UnauthorizedException);
    });

    it("round-trips a refresh token issued by issueRefreshToken", () => {
      const payload = { sub: "u1", email: "admin@khalsaev.com", role: Role.SUPER_ADMIN };
      const token = service.issueRefreshToken(payload);
      expect(service.verifyRefreshToken(token)).toMatchObject(payload);
    });
  });
});
