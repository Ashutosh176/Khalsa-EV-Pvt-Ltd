import path from "node:path";

// Local disk storage for product images until STORAGE_* (S3-compatible)
// credentials are configured for a real phase - see .env's comment on
// those vars. __dirname here is src/common (dev, ts-node) or dist/common
// (built) - both two levels under apps/api, so "../../uploads" always
// resolves to apps/api/uploads regardless of which is running. Gitignored
// since it's runtime-generated content.
export const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
export const PRODUCT_IMAGES_SUBDIR = "products";

const API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

export function toPublicImageUrl(productId: string, filename: string): string {
  return `${API_PUBLIC_URL}/uploads/${PRODUCT_IMAGES_SUBDIR}/${productId}/${filename}`;
}
