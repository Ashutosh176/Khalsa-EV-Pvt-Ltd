import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateVehicleBrandDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
