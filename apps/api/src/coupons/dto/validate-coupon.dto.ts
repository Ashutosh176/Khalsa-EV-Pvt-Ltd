import { IsString, MinLength } from "class-validator";

export class ValidateCouponDto {
  @IsString()
  @MinLength(3)
  code!: string;
}
