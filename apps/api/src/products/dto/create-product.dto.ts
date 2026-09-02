import { ProductStatus, ProductType } from "@prisma/client";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

// Scooters need ScooterSpecification + color variants (Section 10A), which
// land with the Phase 5 scooter sub-track - rejected here rather than
// silently creating an incomplete scooter Product row.
const SUPPORTED_PRODUCT_TYPES = [ProductType.SPARE_PART, ProductType.ACCESSORY] as const;

export class CreateProductDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(1)
  sku!: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(SUPPORTED_PRODUCT_TYPES)
  productType?: ProductType;

  @IsOptional()
  @IsIn(Object.values(ProductStatus))
  status?: ProductStatus;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsInt()
  @Min(1)
  price!: number; // paise

  @IsInt()
  @Min(1)
  mrp!: number; // paise

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  gstPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number;
}
