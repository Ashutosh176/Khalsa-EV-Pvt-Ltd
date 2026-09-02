import { describe, expect, it, jest } from "@jest/globals";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { RolesGuard } from "./roles.guard";

function contextWithUser(role: Role | undefined) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { sub: "u1", email: "a@b.com", role } : undefined }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("allows the request when no @Roles() metadata is set", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(contextWithUser(Role.SUPPORT_MANAGER))).toBe(true);
  });

  it("allows the request when the user's role is in the required list", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.SUPER_ADMIN, Role.PRODUCT_MANAGER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(contextWithUser(Role.PRODUCT_MANAGER))).toBe(true);
  });

  it("denies the request when the user's role is not in the required list", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.SUPER_ADMIN, Role.PRODUCT_MANAGER]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(contextWithUser(Role.SUPPORT_MANAGER))).toThrow();
  });

  it("denies the request when there is no authenticated user", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.SUPER_ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow();
  });
});
