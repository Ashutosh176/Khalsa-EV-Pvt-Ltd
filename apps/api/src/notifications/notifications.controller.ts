import { Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/auth.types";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.findAllForUser(user.sub);
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    await this.notificationsService.markRead(user.sub, id);
    return { status: "ok" };
  }

  @Post("read-all")
  @HttpCode(200)
  async markAllRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllRead(user.sub);
    return { status: "ok" };
  }
}
