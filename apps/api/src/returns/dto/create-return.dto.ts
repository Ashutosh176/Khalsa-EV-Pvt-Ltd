import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateReturnDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  orderItemId?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
