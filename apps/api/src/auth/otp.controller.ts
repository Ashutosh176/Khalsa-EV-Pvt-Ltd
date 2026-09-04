import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { VerifyWidgetTokenDto } from "./dto/verify-widget-token.dto";

// Public endpoint (no auth): the phone is verified before a session
// exists, both at registration and for OTP-based login. Send/retry/
// verify of the actual OTP happen client-side via MSG91's Widget SDK -
// this is the only server-side step, redeeming the resulting
// access-token.
@Controller("auth/otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post("verify-widget")
  @HttpCode(200)
  async verifyWidget(@Body() dto: VerifyWidgetTokenDto) {
    const { verificationId } = await this.otpService.verifyWidgetToken(dto.phone, dto.purpose, dto.accessToken);
    return { status: "verified", verificationId };
  }
}
