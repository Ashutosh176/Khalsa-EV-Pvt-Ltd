import { randomBytes } from "node:crypto";

export function generateOrderNumber(): string {
  return `KEV-${randomBytes(6).toString("hex").toUpperCase()}`;
}
