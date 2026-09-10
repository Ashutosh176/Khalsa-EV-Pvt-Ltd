import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListAdminReviewsQuery {
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

  // `@Type(() => Boolean)` is wrong for query strings: JS's Boolean("false")
  // is `true` (any non-empty string is truthy), so a literal
  // "?isApproved=false" would silently become `true` (see the same fix in
  // list-inventory.query.ts's lowStockOnly). Unlike lowStockOnly though,
  // "omitted" (show every review) and "false" (show only unapproved ones)
  // are different filters here, not the same no-op - so undefined must be
  // passed through as-is rather than coerced to false.
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === "true"))
  @IsBoolean()
  isApproved?: boolean;
}
