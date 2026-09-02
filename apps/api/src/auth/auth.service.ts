import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcrypt";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { requireEnv } from "../common/env";
import type { JwtPayload } from "./auth.types";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "7d";
export const REFRESH_COOKIE_NAME = "khalsa_admin_refresh";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.role || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return user;
  }

  toPayload(user: User): JwtPayload {
    if (!user.role) {
      throw new UnauthorizedException("Not an admin account");
    }
    return { sub: user.id, email: user.email, role: user.role };
  }

  issueAccessToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: requireEnv("JWT_ACCESS_SECRET"),
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  issueRefreshToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: requireEnv("JWT_REFRESH_SECRET"),
      expiresIn: REFRESH_TOKEN_TTL,
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwt.verify<JwtPayload>(token, {
        secret: requireEnv("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async reissueForRefresh(payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.role || !user.isActive) {
      throw new UnauthorizedException("Account no longer has admin access");
    }
    return user;
  }
}
