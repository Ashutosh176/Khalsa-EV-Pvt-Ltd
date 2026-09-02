import { IsString, MinLength } from "class-validator";

export class CreateVehicleVariantDto {
  @IsString()
  vehicleModelId!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}
