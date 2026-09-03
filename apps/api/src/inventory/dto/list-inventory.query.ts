import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListInventoryQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  // `@Type(() => Boolean)` is wrong for query strings: JS's Boolean("false")
  // is `true` (any non-empty string is truthy), so a literal "?lowStockOnly=false"
  // would silently become `true` and filter out every non-low-stock row.
  // Caught via manual browser testing, not curl (which only ever tested
  // omitting the param or passing "true").
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  lowStockOnly?: boolean;
}
