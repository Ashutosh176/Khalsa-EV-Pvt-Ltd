import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateVehicleModelDto {
  @IsString()
  vehicleBrandId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
