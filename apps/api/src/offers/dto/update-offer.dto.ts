import { PartialType } from "@nestjs/mapped-types";
import { IsBoolean, IsOptional } from "class-validator";
import { CreateOfferDto } from "./create-offer.dto";

export class UpdateOfferDto extends PartialType(CreateOfferDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
