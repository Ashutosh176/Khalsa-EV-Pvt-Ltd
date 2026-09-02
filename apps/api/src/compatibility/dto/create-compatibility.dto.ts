import { IsOptional, IsString } from "class-validator";

export class CreateCompatibilityDto {
  @IsString()
  productId!: string;

  @IsString()
  vehicleVariantId!: string;

  @IsOptional()
  @IsString()
  vehicleYearId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
