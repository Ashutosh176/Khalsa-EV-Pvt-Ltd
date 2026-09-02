import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CUSTOMER_REFRESH_COOKIE_NAME, AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { JwtPayload } from "./auth.types";

const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches REFRESH_TOKEN_TTL

@Controller("auth")
export class CustomerAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("register")
  @HttpCode(201)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.register(dto);
    const payload = this.authService.toPayload(user);
    this.setRefreshCookie(res, this.authService.issueRefreshToken(payload));

    return {
      accessToken: this.authService.issueAccessToken(payload),
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    };
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const payload = this.authService.toPayload(user);
    this.setRefreshCookie(res, this.authService.issueRefreshToken(payload));

    return {
      accessToken: this.authService.issueAccessToken(payload),
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[CUSTOMER_REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const decoded = this.authService.verifyRefreshToken(token);
    const user = await this.authService.reissueForRefresh(decoded);
    const payload = this.authService.toPayload(user);
    this.setRefreshCookie(res, this.authService.issueRefreshToken(payload));

    return { accessToken: this.authService.issueAccessToken(payload) };
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(CUSTOMER_REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
    return { status: "ok" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: JwtPayload) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: currentUser.sub } });
    return { id: user.id, name: user.name, email: user.email, phone: user.phone };
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(@CurrentUser() currentUser: JwtPayload, @Body() dto: UpdateProfileDto) {
    const user = await this.authService.updateProfile(currentUser.sub, dto);
    return { id: user.id, name: user.name, email: user.email, phone: user.phone };
  }

  @Post("change-password")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async changePassword(@CurrentUser() currentUser: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(currentUser.sub, dto);
    return { status: "ok" };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(CUSTOMER_REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }
}
