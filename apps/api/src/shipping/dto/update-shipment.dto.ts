import { IsISO8601, IsOptional, IsString } from "class-validator";

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  courierName?: string;

  @IsOptional()
  @IsString()
  awbNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsISO8601()
  expectedDeliveryAt?: string;
}
