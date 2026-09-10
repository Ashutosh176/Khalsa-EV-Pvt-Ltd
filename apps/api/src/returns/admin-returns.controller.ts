import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ReturnsService } from "./returns.service";
import { ListReturnsQuery } from "./dto/list-returns.query";
import { UpdateReturnStatusDto } from "./dto/update-return-status.dto";

@Controller("admin/returns")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.SUPPORT_MANAGER, Role.ORDER_MANAGER)
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  findAll(@Query() query: ListReturnsQuery) {
    return this.returnsService.findAllAdmin(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.returnsService.findOneAdmin(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateReturnStatusDto) {
    return this.returnsService.updateStatusAdmin(id, dto);
  }
}
