import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateBrandDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
