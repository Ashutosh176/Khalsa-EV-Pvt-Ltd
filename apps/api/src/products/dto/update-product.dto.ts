import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateProductDto } from "./create-product.dto";

// Stock is adjusted through the Inventory module (Section 16), not by
// re-editing a product, so initialStock is intentionally excluded here.
export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ["initialStock"] as const)) {}
