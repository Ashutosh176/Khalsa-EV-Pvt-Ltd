import { IsIn, IsString, Length } from "class-validator";
import type { OtpPurpose } from "@prisma/client";

const OTP_PURPOSES: OtpPurpose[] = ["REGISTER", "LOGIN"];

export class VerifyOtpDto {
  @IsString()
  phone!: string;

  @IsIn(OTP_PURPOSES)
  purpose!: OtpPurpose;

  @IsString()
  @Length(4, 6)
  otp!: string;
}
