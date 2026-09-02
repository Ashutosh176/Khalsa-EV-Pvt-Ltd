# Database

PostgreSQL via Prisma ORM. Schema lives at `apps/api/prisma/schema.prisma`; only the
API talks to the database.

## Local setup

The API connects to a native PostgreSQL 18 install (not Docker) via a dedicated
`khalsa_ev` role and `khalsa_ev` database, matching `DATABASE_URL` in `.env.example`.
`docker-compose.yml` remains available as an alternative if you ever develop on a
machine without a native Postgres install.

Prisma 7 requires a driver adapter instead of a `datasource url` in the schema file
(the CLI errors if you try). Connection config for `prisma migrate`/`prisma studio`
lives in `apps/api/prisma.config.ts`; the running NestJS app builds its own
`PrismaClient` with the same adapter in `apps/api/src/prisma/prisma.service.ts`. Both
load `DATABASE_URL` (and everything else) from the single repo-root `.env` - there is
no per-app `.env` file.

```
corepack pnpm --filter @khalsa-ev/api db:migrate   # create/apply a migration
corepack pnpm --filter @khalsa-ev/api db:generate   # regenerate the client only
corepack pnpm --filter @khalsa-ev/api db:seed       # super admin + base categories
corepack pnpm --filter @khalsa-ev/api db:studio     # browse data
```

## Design decisions

**Money is stored as integer paise**, matching `packages/utils/formatIndianRupees`.
At `Int` (32-bit) this caps a single amount at ~₹21 million, which is far beyond any
realistic spare-part/scooter order; revisit to `BigInt` only if that ever changes.

**One `User` table for customers and admins.** `role` is nullable; a customer has
`role = null`, an admin has one of the five fixed `Role` enum values (Section 21).
Customer and admin auth are still separate API flows/guards - "separate" is enforced
at the endpoint/guard level, not by duplicating the users table. `/admin/roles`
(Section 20) is planned as "assign one of the five fixed roles to a user," not a
dynamic permission-matrix builder - there is no `Permission` table. Enforcement is a
NestJS `RolesGuard` + `@Roles(...)` decorator (built in Phase 4), which scales to a
new role via an enum migration without a schema redesign.

**`Product` is the single commerce entity for spare parts and scooters alike**
(Section 10A) - `productType` discriminates, `ScooterSpecification` is a 1:1
extension only present for `SCOOTER` rows, and `ProductVariant` (color/SKU/stock) is
generic but currently only scooters are expected to use it. Cart, wishlist, orders,
and inventory all reference `Product` (and optionally `ProductVariant`) directly, so
there is exactly one purchase path regardless of product type.

**`Inventory` has nullable `productId` *and* `variantId`** - exactly one is set per
row (a plain product tracks stock by `productId`; a color-variant scooter tracks it
by `variantId`). Postgres treats `NULL` as distinct in a normal unique index, so a
plain `@@unique([warehouseId, productId, variantId])` would silently allow duplicate
stock rows for the same warehouse+product whenever `variantId` is `NULL` - a real
overselling risk (Section 16, Section 39). The migration was hand-edited after
`prisma migrate dev --create-only` to add:
- a `CHECK` constraint requiring exactly one of the two FKs to be set, and
- two partial unique indexes (`... WHERE variantId IS NULL` / `... WHERE productId
  IS NULL`) that actually enforce one-row-per-warehouse-per-stockable-unit.

Prisma's schema DSL can't express either of these directly, so if the schema is ever
regenerated from scratch, both need to be re-added by hand to the new migration.

**`ProductCompatibility` has the same NULL-uniqueness gap**, caught the hard way in
Phase 5 by actually exercising the API rather than trusting the schema: the plain
`@@unique([productId, vehicleVariantId, vehicleYearId])` correctly stops duplicates
when `vehicleYearId` is set, but silently let duplicate "compatible with all years"
rows through when it's `NULL` (the common case). Fixed the same way, with a partial
unique index (`migrations/20260902074745_compatibility_partial_unique_index`) on
`(productId, vehicleVariantId) WHERE vehicleYearId IS NULL`. Any future table with a
similarly-nullable discriminator column in a unique constraint needs the same partial
index treatment - a plain `@@unique` including a nullable column is never enough on
its own.

**`OrderStatusHistory` is a separate table**, not just derived from `Order.status`
plus a few timestamp columns, because the customer order-tracking UI needs a real
timeline (Section 15/56 - explicitly no live map, just a status history).

**No dedicated `Permission`/role-permission tables and no `AdminUser` table** - see
above. This keeps the schema aligned with Section 45 ("don't over-engineer") while
still satisfying the RBAC requirement in Section 21.
