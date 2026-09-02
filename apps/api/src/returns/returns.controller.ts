import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/auth.types";
import { ReturnsService } from "./returns.service";
import { CreateReturnDto } from "./dto/create-return.dto";

@Controller("returns")
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReturnDto) {
    return this.returnsService.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.returnsService.findAllForUser(user.sub);
  }
}
