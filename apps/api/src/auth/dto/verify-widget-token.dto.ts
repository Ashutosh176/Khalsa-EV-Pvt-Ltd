import { IsIn, IsString } from "class-validator";
import type { OtpPurpose } from "@prisma/client";

const OTP_PURPOSES: OtpPurpose[] = ["REGISTER", "LOGIN"];

export class VerifyWidgetTokenDto {
  @IsString()
  phone!: string;

  @IsIn(OTP_PURPOSES)
  purpose!: OtpPurpose;

  // The JWT access-token returned by MSG91's Widget SDK (client-side)
  // after it verified the OTP itself.
  @IsString()
  accessToken!: string;
}
