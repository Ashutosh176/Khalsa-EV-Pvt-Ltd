import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;
export type CatalogSort = (typeof SORT_OPTIONS)[number];

export class ListCatalogQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  vehicleVariantId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: CatalogSort;

  // @Type(() => Boolean) would coerce the literal string "false" to
  // `true` (any non-empty string is JS-truthy) - see the identical bug
  // fixed in ListInventoryQuery.lowStockOnly.
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  featured?: boolean;
}
