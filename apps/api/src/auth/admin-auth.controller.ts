import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { ADMIN_REFRESH_COOKIE_NAME, AuthService } from "./auth.service";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { JwtPayload } from "./auth.types";

const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches REFRESH_TOKEN_TTL

@Controller("auth/admin")
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    this.authService.requireAdminRole(user);
    const payload = this.authService.toPayload(user);
    this.setRefreshCookie(res, this.authService.issueRefreshToken(payload));

    return {
      accessToken: this.authService.issueAccessToken(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[ADMIN_REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const decoded = this.authService.verifyRefreshToken(token);
    const user = await this.authService.reissueForRefresh(decoded);
    this.authService.requireAdminRole(user);
    const payload = this.authService.toPayload(user);
    this.setRefreshCookie(res, this.authService.issueRefreshToken(payload));

    return { accessToken: this.authService.issueAccessToken(payload) };
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, { path: "/api/v1/auth/admin" });
    return { status: "ok" };
  }

  @Get("me")
  @UseGuards(AdminAuthGuard)
  async me(@CurrentUser() currentUser: JwtPayload) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: currentUser.sub } });
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(ADMIN_REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth/admin",
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }
}
