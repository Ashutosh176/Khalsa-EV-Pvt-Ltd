import { IsIn, IsString } from "class-validator";
import type { OtpPurpose } from "@prisma/client";

const OTP_PURPOSES: OtpPurpose[] = ["REGISTER", "LOGIN"];

export class SendOtpDto {
  @IsString()
  phone!: string;

  @IsIn(OTP_PURPOSES)
  purpose!: OtpPurpose;
}
