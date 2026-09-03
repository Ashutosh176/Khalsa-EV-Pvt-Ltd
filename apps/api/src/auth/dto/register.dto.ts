import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  phone!: string;

  // The id returned by POST /auth/otp/verify for this phone number and
  // purpose: REGISTER - proves the phone was OTP-verified via MSG91
  // moments earlier, without re-running OTP verification here.
  @IsString()
  phoneVerificationId!: string;
}
