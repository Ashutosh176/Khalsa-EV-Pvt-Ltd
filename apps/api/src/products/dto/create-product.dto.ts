import { Type } from "class-transformer";
import { BatteryType, ProductStatus, ProductType } from "@prisma/client";
import {
  ArrayMaxSize,
  IsArray,
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
  ValidateNested,
} from "class-validator";

// Every ProductType is creatable through the admin API - ScooterSpecification
// (required alongside productType = SCOOTER, see below) is what used to be
// missing here (Section 10A / Phase 5 scooter sub-track).
const SUPPORTED_PRODUCT_TYPES = Object.values(ProductType);

// 1:1 with ScooterSpecification (schema.prisma) - required fields here match
// that model's non-nullable columns.
export class ScooterSpecificationDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  batteryCapacityAh?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  batteryCapacityWh?: number;

  @IsIn(Object.values(BatteryType))
  batteryType!: BatteryType;

  @IsInt()
  @Min(0)
  motorPowerW!: number;

  @IsInt()
  @Min(0)
  topSpeedKmh!: number;

  @IsInt()
  @Min(0)
  rangeKm!: number;

  @IsNumber()
  @Min(0)
  chargingTimeHours!: number;

  @IsOptional()
  @IsString()
  brakingType?: string;

  @IsOptional()
  @IsString()
  tyreType?: string;

  @IsOptional()
  @IsString()
  tyreSize?: string;

  @IsOptional()
  @IsString()
  suspension?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kerbWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loadCapacityKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  seatHeightMm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  groundClearanceMm?: number;

  @IsOptional()
  @IsString()
  warrantyTerms?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  highlightFeatures?: string[];
}

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

  // Required by the service when productType = SCOOTER, rejected otherwise -
  // see ProductsService.create/update.
  @IsOptional()
  @ValidateNested()
  @Type(() => ScooterSpecificationDto)
  scooterSpec?: ScooterSpecificationDto;
}
