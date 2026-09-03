import { BadRequestException } from "@nestjs/common";

// Accepts a 10-digit Indian mobile number, optionally prefixed with
// "91" or "+91", and normalizes it to the bare "91XXXXXXXXXX" form
// MSG91's API expects. Indian mobile numbers always start 6-9.
const INDIAN_MOBILE_REGEX = /^([6-9]\d{9})$/;

export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  if (!INDIAN_MOBILE_REGEX.test(local)) {
    throw new BadRequestException("Enter a valid 10-digit Indian mobile number");
  }
  return `91${local}`;
}
