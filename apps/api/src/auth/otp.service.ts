import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { OtpPurpose } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { Msg91Client } from "./msg91.client";
import { normalizeIndianMobile } from "./phone.util";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // matches MSG91's default template OTP validity
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_REQUESTS_PER_WINDOW = 3;
const OTP_MAX_VERIFY_ATTEMPTS = 5;
// How long a verified-but-not-yet-consumed proof stays redeemable by
// register/login-otp, so a user who verifies then dawdles on the rest
// of the form isn't forced to re-verify their phone.
const OTP_VERIFICATION_VALID_MS = 15 * 60 * 1000;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly msg91: Msg91Client,
  ) {}

  async sendOtp(phone: string, purpose: OtpPurpose): Promise<{ expiresAt: Date }> {
    const mobile = normalizeIndianMobile(phone);

    const recent = await this.prisma.phoneOtpVerification.findMany({
      where: { phone: mobile, purpose, requestedAt: { gte: new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MS) } },
      orderBy: { requestedAt: "desc" },
    });

    const mostRecent = recent[0];
    if (mostRecent && Date.now() - mostRecent.requestedAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new HttpException("Please wait a minute before requesting another OTP", HttpStatus.TOO_MANY_REQUESTS);
    }
    if (recent.length >= OTP_MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException("Too many OTP requests. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.msg91.sendOtp(mobile);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await this.prisma.phoneOtpVerification.create({ data: { phone: mobile, purpose, expiresAt } });
    return { expiresAt };
  }

  async verifyOtp(phone: string, purpose: OtpPurpose, otp: string): Promise<{ verificationId: string }> {
    const mobile = normalizeIndianMobile(phone);

    const record = await this.prisma.phoneOtpVerification.findFirst({
      where: { phone: mobile, purpose, verified: false, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { requestedAt: "desc" },
    });
    if (!record) {
      throw new BadRequestException("No pending OTP for this number. Please request a new one.");
    }
    if (record.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      throw new BadRequestException("Too many incorrect attempts. Please request a new OTP.");
    }

    const isValid = await this.msg91.verifyOtp(mobile, otp);
    if (!isValid) {
      await this.prisma.phoneOtpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("Incorrect OTP. Please try again.");
    }

    const verified = await this.prisma.phoneOtpVerification.update({
      where: { id: record.id },
      data: { verified: true, verifiedAt: new Date() },
    });
    return { verificationId: verified.id };
  }

  // Redeems a verified proof exactly once - called by register/login-otp
  // right before they act on it, so the same proof can't be replayed
  // for a second account or a second login.
  async consumeVerification(verificationId: string, phone: string, purpose: OtpPurpose): Promise<void> {
    const mobile = normalizeIndianMobile(phone);
    const record = await this.prisma.phoneOtpVerification.findUnique({ where: { id: verificationId } });

    const isUsable =
      record &&
      record.phone === mobile &&
      record.purpose === purpose &&
      record.verified &&
      !record.consumedAt &&
      record.verifiedAt &&
      Date.now() - record.verifiedAt.getTime() <= OTP_VERIFICATION_VALID_MS;

    if (!isUsable) {
      throw new BadRequestException("Phone verification is missing or has expired. Please verify your mobile number again.");
    }

    await this.prisma.phoneOtpVerification.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  }
}
