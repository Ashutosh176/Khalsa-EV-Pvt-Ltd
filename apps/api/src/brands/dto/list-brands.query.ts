import { ProductType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class ListBrandsQuery {
  // Scopes the result to brands with at least one product of this type -
  // keeps the Electric Scooters section's brand filter (Section 60) from
  // listing spare-part brands and vice versa, without a separate endpoint.
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;
}
