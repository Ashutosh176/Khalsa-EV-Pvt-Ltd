import { IsOptional, IsString } from "class-validator";

export class ListCompatibilityQuery {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  vehicleVariantId?: string;
}
