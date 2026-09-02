import type { Role } from "@prisma/client";

// role is null for a customer account, one of the five fixed roles for
// an admin account (Section 21) - both share the User table.
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role | null;
}
