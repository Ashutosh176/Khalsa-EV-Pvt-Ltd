import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { requireEnv } from "../../common/env";
import type { JwtPayload } from "../auth.types";
import type { AuthenticatedRequest } from "./admin-auth.guard";

// Any authenticated user (customer or admin) - unlike AdminAuthGuard,
// does not require a non-null role. Used for cart/wishlist/account
// routes where a plain customer account is the normal case.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Missing authentication token");
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: requireEnv("JWT_ACCESS_SECRET"),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return undefined;
    return header.slice("Bearer ".length);
  }
}
