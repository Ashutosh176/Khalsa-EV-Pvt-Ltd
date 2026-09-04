import { BadRequestException, Injectable } from "@nestjs/common";
import type { OtpPurpose } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { Msg91Client } from "./msg91.client";
import { normalizeIndianMobile } from "./phone.util";

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

  // The MSG91 Widget SDK (client-side) already sent and verified the
  // OTP itself before this is ever called - our job is only to redeem
  // its access-token server-side via MSG91's verifyAccessToken API and
  // confirm the phone MSG91 actually verified matches what the caller
  // claims, before minting our own verified proof (a PhoneOtpVerification
  // row) that register/login-otp can consume exactly once.
  async verifyWidgetToken(phone: string, purpose: OtpPurpose, accessToken: string): Promise<{ verificationId: string }> {
    const mobile = normalizeIndianMobile(phone);

    const verifiedRaw = await this.msg91.verifyWidgetAccessToken(accessToken);
    if (!verifiedRaw) {
      throw new BadRequestException("Phone verification failed or has expired. Please try again.");
    }

    let verifiedMobile: string;
    try {
      verifiedMobile = normalizeIndianMobile(verifiedRaw);
    } catch {
      throw new BadRequestException("Could not confirm the verified phone number. Please try again.");
    }
    if (verifiedMobile !== mobile) {
      throw new BadRequestException("The verified phone number does not match the number submitted.");
    }

    const record = await this.prisma.phoneOtpVerification.create({
      data: {
        phone: mobile,
        purpose,
        verified: true,
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + OTP_VERIFICATION_VALID_MS),
      },
    });
    return { verificationId: record.id };
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
