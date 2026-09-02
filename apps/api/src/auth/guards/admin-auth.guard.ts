import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { requireEnv } from "../../common/env";
import type { JwtPayload } from "../auth.types";

export type AuthenticatedRequest = Request & { user: JwtPayload };

@Injectable()
export class AdminAuthGuard implements CanActivate {
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
      if (!payload.role) {
        throw new UnauthorizedException("Not an admin account");
      }
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
