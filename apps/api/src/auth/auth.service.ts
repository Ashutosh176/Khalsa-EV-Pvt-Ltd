import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { requireEnv } from "../common/env";
import type { JwtPayload } from "./auth.types";
import type { RegisterDto } from "./dto/register.dto";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { ChangePasswordDto } from "./dto/change-password.dto";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "7d";
export const ADMIN_REFRESH_COOKIE_NAME = "khalsa_admin_refresh";
export const CUSTOMER_REFRESH_COOKIE_NAME = "khalsa_customer_refresh";

const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Shared by both admin and customer login - role is checked by the
  // caller (AdminAuthController requires a non-null role; customer
  // login accepts any active account).
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return user;
  }

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await hash(dto.password, PASSWORD_HASH_ROUNDS);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        role: null,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, phone: dto.phone },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const matches = await compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException("Current password is incorrect");
    }
    const passwordHash = await hash(dto.newPassword, PASSWORD_HASH_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  requireAdminRole(user: User): void {
    if (!user.role) {
      throw new UnauthorizedException("This account does not have admin access");
    }
  }

  toPayload(user: User): JwtPayload {
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
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account no longer exists or is inactive");
    }
    return user;
  }
}
