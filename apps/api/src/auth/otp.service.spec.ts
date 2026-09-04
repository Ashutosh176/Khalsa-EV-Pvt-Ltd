import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException } from "@nestjs/common";
import type { OtpPurpose } from "@prisma/client";
import { OtpService } from "./otp.service";
import { PrismaService } from "../prisma/prisma.service";
import { Msg91Client } from "./msg91.client";

type OtpRow = {
  id: string;
  phone: string;
  purpose: OtpPurpose;
  verified: boolean;
  verifiedAt: Date | null;
  consumedAt: Date | null;
  attempts: number;
  requestedAt: Date;
  expiresAt: Date;
};
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;

function otpRow(overrides: Partial<OtpRow> = {}): OtpRow {
  return {
    id: "otp-1",
    phone: "919876543210",
    purpose: "REGISTER",
    verified: false,
    verifiedAt: null,
    consumedAt: null,
    attempts: 0,
    requestedAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    ...overrides,
  };
}

describe("OtpService", () => {
  let service: OtpService;
  let prisma: {
    phoneOtpVerification: {
      findUnique: Mock<AsyncFn<OtpRow | null>>;
      create: Mock<AsyncFn<OtpRow>>;
      update: Mock<AsyncFn<OtpRow>>;
    };
  };
  let msg91: { verifyWidgetAccessToken: Mock<AsyncFn<string | null>> };

  beforeEach(() => {
    prisma = {
      phoneOtpVerification: {
        findUnique: jest.fn<AsyncFn<OtpRow | null>>(),
        create: jest.fn<AsyncFn<OtpRow>>().mockResolvedValue(otpRow({ verified: true, verifiedAt: new Date() })),
        update: jest.fn<AsyncFn<OtpRow>>().mockImplementation(() => Promise.resolve(otpRow())),
      },
    };
    msg91 = {
      verifyWidgetAccessToken: jest.fn<AsyncFn<string | null>>().mockResolvedValue("919876543210"),
    };
    service = new OtpService(prisma as unknown as PrismaService, msg91 as unknown as Msg91Client);
  });

  describe("verifyWidgetToken", () => {
    it("rejects an invalid phone number before ever calling MSG91", async () => {
      await expect(service.verifyWidgetToken("12345", "REGISTER", "jwt")).rejects.toThrow(BadRequestException);
      expect(msg91.verifyWidgetAccessToken).not.toHaveBeenCalled();
    });

    it("rejects when MSG91 rejects the access-token", async () => {
      msg91.verifyWidgetAccessToken.mockResolvedValue(null);
      await expect(service.verifyWidgetToken("9876543210", "REGISTER", "bad-jwt")).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.phoneOtpVerification.create).not.toHaveBeenCalled();
    });

    it("rejects when the MSG91-verified phone does not match the claimed phone", async () => {
      msg91.verifyWidgetAccessToken.mockResolvedValue("919999999999");
      await expect(service.verifyWidgetToken("9876543210", "REGISTER", "jwt")).rejects.toThrow(BadRequestException);
      expect(prisma.phoneOtpVerification.create).not.toHaveBeenCalled();
    });

    it("matches after normalizing both sides, even if MSG91 returns a bare 10-digit number", async () => {
      msg91.verifyWidgetAccessToken.mockResolvedValue("9876543210");
      await service.verifyWidgetToken("9876543210", "REGISTER", "jwt");
      expect(prisma.phoneOtpVerification.create).toHaveBeenCalled();
    });

    it("creates an already-verified row and returns its id once MSG91 confirms a matching phone", async () => {
      prisma.phoneOtpVerification.create.mockResolvedValue(otpRow({ id: "otp-99", verified: true }));

      const result = await service.verifyWidgetToken("9876543210", "LOGIN", "jwt");

      expect(result).toEqual({ verificationId: "otp-99" });
      expect(prisma.phoneOtpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: "919876543210", purpose: "LOGIN", verified: true }),
        }),
      );
    });
  });

  describe("consumeVerification", () => {
    it("rejects when the verification record does not exist", async () => {
      prisma.phoneOtpVerification.findUnique.mockResolvedValue(null);
      await expect(service.consumeVerification("missing", "9876543210", "REGISTER")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects when the phone does not match the record", async () => {
      prisma.phoneOtpVerification.findUnique.mockResolvedValue(
        otpRow({ phone: "919999999999", verified: true, verifiedAt: new Date() }),
      );
      await expect(service.consumeVerification("otp-1", "9876543210", "REGISTER")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects when the purpose does not match the record", async () => {
      prisma.phoneOtpVerification.findUnique.mockResolvedValue(
        otpRow({ purpose: "LOGIN", verified: true, verifiedAt: new Date() }),
      );
      await expect(service.consumeVerification("otp-1", "9876543210", "REGISTER")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects when the record was never verified", async () => {
      prisma.phoneOtpVerification.findUnique.mockResolvedValue(otpRow({ verified: false }));
      await expect(service.consumeVerification("otp-1", "9876543210", "REGISTER")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects when the record was already consumed", async () => {
      prisma.phoneOtpVerification.findUnique.mockResolvedValue(
        otpRow({ verified: true, verifiedAt: new Date(), consumedAt: new Date() }),
      );
      await expect(service.consumeVerification("otp-1", "9876543210", "REGISTER")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects when the verified proof has gone stale", async () => {
      prisma.phoneOtpVerification.findUnique.mockResolvedValue(
        otpRow({ verified: true, verifiedAt: new Date(Date.now() - 20 * 60 * 1000) }),
      );
      await expect(service.consumeVerification("otp-1", "9876543210", "REGISTER")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("marks a fresh, matching, unconsumed proof as consumed", async () => {
      prisma.phoneOtpVerification.findUnique.mockResolvedValue(
        otpRow({ id: "otp-1", verified: true, verifiedAt: new Date() }),
      );

      await service.consumeVerification("otp-1", "9876543210", "REGISTER");

      expect(prisma.phoneOtpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "otp-1" }, data: expect.objectContaining({ consumedAt: expect.any(Date) }) }),
      );
    });
  });
});
