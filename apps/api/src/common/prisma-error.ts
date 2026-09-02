import { Prisma } from "@prisma/client";

// Prisma 7's driver-adapter errors don't populate meta.target the way the
// classic Rust query engine did (meta instead carries a nested
// driverAdapterError) - the underlying Postgres constraint name (e.g.
// "Product_sku_key") is still reliably present in the error message, so
// that's used as a fallback field match.
export function isUniqueConstraintError(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  if (!field) return true;

  const target = error.meta?.target;
  if (Array.isArray(target) && target.includes(field)) return true;
  if (typeof target === "string" && target === field) return true;

  return error.message.toLowerCase().includes(field.toLowerCase());
}
