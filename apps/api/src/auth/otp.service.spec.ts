import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, HttpException } from "@nestjs/common";
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
      findMany: Mock<AsyncFn<OtpRow[]>>;
      findFirst: Mock<AsyncFn<OtpRow | null>>;
      findUnique: Mock<AsyncFn<OtpRow | null>>;
      create: Mock<AsyncFn<OtpRow>>;
      update: Mock<AsyncFn<OtpRow>>;
    };
  };
  let msg91: { sendOtp: Mock<AsyncFn<void>>; verifyOtp: Mock<AsyncFn<boolean>> };

  beforeEach(() => {
    prisma = {
      phoneOtpVerification: {
        findMany: jest.fn<AsyncFn<OtpRow[]>>().mockResolvedValue([]),
        findFirst: jest.fn<AsyncFn<OtpRow | null>>(),
        findUnique: jest.fn<AsyncFn<OtpRow | null>>(),
        create: jest.fn<AsyncFn<OtpRow>>().mockResolvedValue(otpRow()),
        update: jest.fn<AsyncFn<OtpRow>>().mockImplementation(() => Promise.resolve(otpRow())),
      },
    };
    msg91 = {
      sendOtp: jest.fn<AsyncFn<void>>().mockResolvedValue(undefined),
      verifyOtp: jest.fn<AsyncFn<boolean>>().mockResolvedValue(true),
    };
    service = new OtpService(prisma as unknown as PrismaService, msg91 as unknown as Msg91Client);
  });

  describe("sendOtp", () => {
    it("normalizes the phone before calling MSG91", async () => {
      await service.sendOtp("9876543210", "REGISTER");
      expect(msg91.sendOtp).toHaveBeenCalledWith("919876543210");
    });

    it("rejects an invalid phone number before ever calling MSG91", async () => {
      await expect(service.sendOtp("12345", "REGISTER")).rejects.toThrow(BadRequestException);
      expect(msg91.sendOtp).not.toHaveBeenCalled();
    });

    it("throttles a resend within the cooldown window", async () => {
      prisma.phoneOtpVerification.findMany.mockResolvedValue([otpRow({ requestedAt: new Date() })]);
      await expect(service.sendOtp("9876543210", "REGISTER")).rejects.toThrow(HttpException);
      expect(msg91.sendOtp).not.toHaveBeenCalled();
    });

    it("rejects once the per-window request cap is reached", async () => {
      const old = new Date(Date.now() - 5 * 60 * 1000);
      prisma.phoneOtpVerification.findMany.mockResolvedValue([
        otpRow({ id: "a", requestedAt: old }),
        otpRow({ id: "b", requestedAt: old }),
        otpRow({ id: "c", requestedAt: old }),
      ]);
      await expect(service.sendOtp("9876543210", "REGISTER")).rejects.toThrow(HttpException);
    });

    it("creates a PhoneOtpVerification row after MSG91 accepts the send", async () => {
      await service.sendOtp("9876543210", "LOGIN");
      expect(prisma.phoneOtpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ phone: "919876543210", purpose: "LOGIN" }) }),
      );
    });
  });

  describe("verifyOtp", () => {
    it("rejects when there is no pending OTP for this phone/purpose", async () => {
      prisma.phoneOtpVerification.findFirst.mockResolvedValue(null);
      await expect(service.verifyOtp("9876543210", "REGISTER", "1234")).rejects.toThrow(BadRequestException);
    });

    it("rejects once max verify attempts are exhausted", async () => {
      prisma.phoneOtpVerification.findFirst.mockResolvedValue(otpRow({ attempts: 5 }));
      await expect(service.verifyOtp("9876543210", "REGISTER", "1234")).rejects.toThrow(BadRequestException);
      expect(msg91.verifyOtp).not.toHaveBeenCalled();
    });

    it("increments attempts and rejects when MSG91 says the OTP is wrong", async () => {
      prisma.phoneOtpVerification.findFirst.mockResolvedValue(otpRow({ attempts: 1 }));
      msg91.verifyOtp.mockResolvedValue(false);

      await expect(service.verifyOtp("9876543210", "REGISTER", "0000")).rejects.toThrow(BadRequestException);
      expect(prisma.phoneOtpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { attempts: { increment: 1 } } }),
      );
    });

    it("marks the row verified and returns its id when MSG91 confirms the OTP", async () => {
      prisma.phoneOtpVerification.findFirst.mockResolvedValue(otpRow({ id: "otp-77" }));
      prisma.phoneOtpVerification.update.mockResolvedValue(otpRow({ id: "otp-77", verified: true }));

      const result = await service.verifyOtp("9876543210", "REGISTER", "1234");

      expect(result).toEqual({ verificationId: "otp-77" });
      expect(prisma.phoneOtpVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "otp-77" },
          data: expect.objectContaining({ verified: true }),
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
