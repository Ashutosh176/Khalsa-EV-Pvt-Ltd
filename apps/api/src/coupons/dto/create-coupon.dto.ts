import { CouponType } from "@prisma/client";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  code!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  // Percent (1-100) for PERCENTAGE, paise for FLAT - validated together
  // with `type` in CouponsService since class-validator can't easily
  // express "range depends on a sibling field".
  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
