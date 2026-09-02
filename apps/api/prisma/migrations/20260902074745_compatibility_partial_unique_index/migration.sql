-- The existing @@unique([productId, vehicleVariantId, vehicleYearId])
-- correctly stops duplicate mappings when vehicleYearId is set, but
-- Postgres treats NULL as distinct in a plain unique index, so two rows
-- with the same productId+vehicleVariantId and vehicleYearId = NULL
-- (the common "compatible with all years of this variant" case) slipped
-- through - same class of bug as the Inventory partial indexes in the
-- init migration. This partial index closes that gap.
CREATE UNIQUE INDEX "ProductCompatibility_product_variant_no_year_unique"
  ON "ProductCompatibility"("productId", "vehicleVariantId")
  WHERE "vehicleYearId" IS NULL;
