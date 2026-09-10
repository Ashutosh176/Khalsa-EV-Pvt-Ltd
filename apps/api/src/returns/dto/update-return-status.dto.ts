import { IsEnum, IsOptional, IsString } from "class-validator";
import { ReturnStatus } from "@prisma/client";

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status!: ReturnStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}
