import { ArrayMinSize, IsArray, IsString } from "class-validator";

// One spare part mapped to many compatible vehicles in a single call
// (Section 10: "Admin must be able to map one spare part to multiple
// compatible vehicles").
export class BulkCreateCompatibilityDto {
  @IsString()
  productId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  vehicleVariantIds!: string[];
}
