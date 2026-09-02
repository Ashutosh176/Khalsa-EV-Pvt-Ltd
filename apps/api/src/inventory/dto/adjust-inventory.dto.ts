import { IsInt, IsString, MinLength, NotEquals } from "class-validator";

export class AdjustInventoryDto {
  // Positive to add stock (e.g. new stock received), negative to remove
  // it (e.g. damaged/lost goods) - never zero, that wouldn't be an
  // adjustment at all.
  @IsInt()
  @NotEquals(0)
  quantityChange!: number;

  @IsString()
  @MinLength(1)
  reason!: string;
}
