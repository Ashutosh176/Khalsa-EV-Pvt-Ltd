import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash } from "bcrypt";
import { Role } from "@prisma/client";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { OtpService } from "./otp.service";
import type { RegisterDto } from "./dto/register.dto";

type UserRow = {
  id: string;
  email: string;
  phone?: string | null;
  role: Role | null;
  isActive: boolean;
  passwordHash: string;
};
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;

function baseRegisterDto(overrides: Partial<RegisterDto> = {}): RegisterDto {
  return {
    email: "new@khalsaev.com",
    password: "password123",
    name: "New Customer",
    phone: "9876543210",
    phoneVerificationId: "otp-1",
    ...overrides,
  };
}

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: Mock<AsyncFn<UserRow | null>>;
      findUniqueOrThrow: Mock<AsyncFn<UserRow>>;
      create: Mock<AsyncFn<UserRow>>;
      update: Mock<AsyncFn<UserRow>>;
    };
  };
  let otpService: { consumeVerification: Mock<AsyncFn<void>> };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    prisma = {
      user: {
        findUnique: jest.fn<AsyncFn<UserRow | null>>(),
        findUniqueOrThrow: jest.fn<AsyncFn<UserRow>>(),
        create: jest.fn<AsyncFn<UserRow>>(),
        update: jest.fn<AsyncFn<UserRow>>(),
      },
    };
    otpService = { consumeVerification: jest.fn<AsyncFn<void>>().mockResolvedValue(undefined) };
    service = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService(),
      otpService as unknown as OtpService,
    );
  });

  describe("validateUser", () => {
    it("rejects an unknown email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.validateUser("nobody@khalsaev.com", "password123")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("accepts a customer account (role is null) - customer login has no role requirement", async () => {
      const user = {
        id: "u1",
        email: "customer@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: await hash("password123", 4),
      };
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(service.validateUser("customer@khalsaev.com", "password123")).resolves.toEqual(user);
    });

    it("rejects a deactivated account", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "admin@khalsaev.com",
        role: Role.SUPER_ADMIN,
        isActive: false,
        passwordHash: await hash("password123", 4),
      });
      await expect(service.validateUser("admin@khalsaev.com", "password123")).rejects.toThrow(
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
      await expect(service.validateUser("admin@khalsaev.com", "wrong-password")).rejects.toThrow(
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
      await expect(service.validateUser("admin@khalsaev.com", "correct-password")).resolves.toEqual(user);
    });
  });

  describe("requireAdminRole", () => {
    it("rejects a customer account", () => {
      expect(() => service.requireAdminRole({ role: null } as UserRow as never)).toThrow(UnauthorizedException);
    });

    it("accepts any non-null role", () => {
      expect(() => service.requireAdminRole({ role: Role.SUPPORT_MANAGER } as UserRow as never)).not.toThrow();
    });
  });

  describe("register", () => {
    it("rejects when the email is already taken", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "existing",
        email: "taken@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: "x",
      });
      await expect(service.register(baseRegisterDto({ email: "taken@khalsaev.com" }))).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(otpService.consumeVerification).not.toHaveBeenCalled();
    });

    it("rejects when the phone is already taken", async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // email check: free
        .mockResolvedValueOnce({
          id: "existing",
          email: "someoneelse@khalsaev.com",
          phone: "919876543210",
          role: null,
          isActive: true,
          passwordHash: "x",
        }); // phone check: taken

      await expect(service.register(baseRegisterDto())).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(otpService.consumeVerification).not.toHaveBeenCalled();
    });

    it("rejects when the phone OTP verification proof is missing, stale or reused", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      otpService.consumeVerification.mockRejectedValue(
        new BadRequestException("Phone verification is missing or has expired. Please verify your mobile number again."),
      );

      await expect(service.register(baseRegisterDto())).rejects.toThrow(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("consumes the OTP verification proof for the given phone and REGISTER purpose", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "new-user",
        email: "new@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: "hashed",
      });

      await service.register(baseRegisterDto({ phoneVerificationId: "otp-42" }));

      expect(otpService.consumeVerification).toHaveBeenCalledWith("otp-42", "9876543210", "REGISTER");
    });

    it("creates the user with role: null (never an admin via self-registration)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "new-user",
        email: "new@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: "hashed",
      });

      await service.register(baseRegisterDto());

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: null, email: "new@khalsaev.com", phone: "919876543210" }),
        }),
      );
    });

    it("stamps phoneVerifiedAt on the new user, proving the phone was OTP-verified", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "new-user",
        email: "new@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: "hashed",
      });

      await service.register(baseRegisterDto());

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ phoneVerifiedAt: expect.any(Date) }) }),
      );
    });

    it("never stores the plaintext password", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "new-user",
        email: "new@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: "hashed",
      });

      await service.register(baseRegisterDto({ password: "super-secret-password" }));

      const [[createArgs]] = prisma.user.create.mock.calls as [[{ data: { passwordHash: string } }]];
      expect(createArgs.data.passwordHash).not.toBe("super-secret-password");
    });
  });

  describe("loginWithOtp", () => {
    it("consumes the OTP verification proof for the given phone and LOGIN purpose", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "customer@khalsaev.com",
        phone: "919876543210",
        role: null,
        isActive: true,
        passwordHash: "hashed",
      });

      await service.loginWithOtp("9876543210", "otp-99");

      expect(otpService.consumeVerification).toHaveBeenCalledWith("otp-99", "9876543210", "LOGIN");
    });

    it("rejects when the verification proof is invalid", async () => {
      otpService.consumeVerification.mockRejectedValue(new BadRequestException("expired"));
      await expect(service.loginWithOtp("9876543210", "otp-99")).rejects.toThrow(BadRequestException);
    });

    it("rejects when no account exists with the verified phone number", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.loginWithOtp("9876543210", "otp-99")).rejects.toThrow(UnauthorizedException);
    });

    it("rejects a deactivated account", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "customer@khalsaev.com",
        phone: "919876543210",
        role: null,
        isActive: false,
        passwordHash: "hashed",
      });
      await expect(service.loginWithOtp("9876543210", "otp-99")).rejects.toThrow(UnauthorizedException);
    });

    it("returns the matching active user on success", async () => {
      const user = {
        id: "u1",
        email: "customer@khalsaev.com",
        phone: "919876543210",
        role: null,
        isActive: true,
        passwordHash: "hashed",
      };
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(service.loginWithOtp("9876543210", "otp-99")).resolves.toEqual(user);
    });
  });

  describe("updateProfile", () => {
    it("updates only name and phone", async () => {
      prisma.user.update.mockResolvedValue({
        id: "u1",
        email: "customer@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: "hashed",
      });

      await service.updateProfile("u1", { name: "New Name", phone: "9999999999" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { name: "New Name", phone: "9999999999" },
      });
    });
  });

  describe("changePassword", () => {
    it("rejects when the current password is wrong", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: "u1",
        email: "customer@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: await hash("correct-password", 4),
      });

      await expect(
        service.changePassword("u1", { currentPassword: "wrong-password", newPassword: "new-password-123" }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("hashes and saves the new password when the current password matches", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: "u1",
        email: "customer@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: await hash("correct-password", 4),
      });
      prisma.user.update.mockResolvedValue({
        id: "u1",
        email: "customer@khalsaev.com",
        role: null,
        isActive: true,
        passwordHash: "new-hashed",
      });

      await service.changePassword("u1", { currentPassword: "correct-password", newPassword: "new-password-123" });

      const [[updateArgs]] = prisma.user.update.mock.calls as [[{ where: { id: string }; data: { passwordHash: string } }]];
      expect(updateArgs.where).toEqual({ id: "u1" });
      expect(updateArgs.data.passwordHash).not.toBe("new-password-123");
    });
  });

  describe("token issuance", () => {
    it("issues an access token that verifies with the access secret", () => {
      const payload = { sub: "u1", email: "admin@khalsaev.com", role: Role.SUPER_ADMIN };
      const token = service.issueAccessToken(payload);
      const jwt = new JwtService();
      expect(jwt.verify(token, { secret: "test-access-secret" })).toMatchObject(payload);
    });

    it("issues a valid token for a customer payload with role: null", () => {
      const payload = { sub: "u1", email: "customer@khalsaev.com", role: null };
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
