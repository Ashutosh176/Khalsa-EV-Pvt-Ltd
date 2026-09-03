import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { SendOtpDto } from "./dto/send-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";

// Public endpoints (no auth): OTP send/verify happens before a session
// exists, both at registration and for OTP-based login. Abuse is
// bounded by OtpService's per-phone rate limiting rather than a guard.
@Controller("auth/otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post("send")
  @HttpCode(200)
  async send(@Body() dto: SendOtpDto) {
    const { expiresAt } = await this.otpService.sendOtp(dto.phone, dto.purpose);
    return { status: "sent", expiresAt };
  }

  @Post("verify")
  @HttpCode(200)
  async verify(@Body() dto: VerifyOtpDto) {
    const { verificationId } = await this.otpService.verifyOtp(dto.phone, dto.purpose, dto.otp);
    return { status: "verified", verificationId };
  }
}
