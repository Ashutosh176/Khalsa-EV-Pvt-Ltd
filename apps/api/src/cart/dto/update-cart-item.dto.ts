import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  savedForLater?: boolean;
}
