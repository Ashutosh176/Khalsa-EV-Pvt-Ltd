import { IsInt, IsString, Max, Min } from "class-validator";

export class CreateVehicleYearDto {
  @IsString()
  vehicleVariantId!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
}
