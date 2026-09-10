import { IsOptional, IsString } from "class-validator";

export class CreateOrderDto {
  @IsString()
  shippingAddressId!: string;

  @IsOptional()
  @IsString()
  billingAddressId?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
