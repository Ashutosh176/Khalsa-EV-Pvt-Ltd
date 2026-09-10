import path from "node:path";

// Local disk storage for product images until STORAGE_* (S3-compatible)
// credentials are configured for a real phase - see .env's comment on
// those vars. __dirname here is src/common (dev, ts-node) or dist/common
// (built) - both two levels under apps/api, so "../../uploads" always
// resolves to apps/api/uploads regardless of which is running. Gitignored
// since it's runtime-generated content.
//
// Computed lazily, not as a top-level constant: this module is imported
// (transitively, via ProductsService) by unit tests that run under Jest's
// ESM mode, where __dirname doesn't exist - a top-level `path.resolve(
// __dirname, ...)` would throw on import alone, before any test even runs.
export function getUploadsDir(): string {
  return path.resolve(__dirname, "../../uploads");
}
export const PRODUCT_IMAGES_SUBDIR = "products";
export const OFFER_IMAGES_SUBDIR = "offers";

const API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

export function toPublicImageUrl(productId: string, filename: string): string {
  return `${API_PUBLIC_URL}/uploads/${PRODUCT_IMAGES_SUBDIR}/${productId}/${filename}`;
}

export function toPublicUploadUrl(subdir: string, entityId: string, filename: string): string {
  return `${API_PUBLIC_URL}/uploads/${subdir}/${entityId}/${filename}`;
}
