import { IsString } from "class-validator";

export class LoginOtpDto {
  @IsString()
  phone!: string;

  // The id returned by POST /auth/otp/verify for this phone number and
  // purpose: LOGIN.
  @IsString()
  verificationId!: string;
}
