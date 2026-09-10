import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuditLogService } from "./audit-log.service";
import { ListAuditLogQuery } from "./dto/list-audit-log.query";

// SUPER_ADMIN only - same rationale as AdminUsersController: this is the
// accountability trail over every OTHER admin's actions, not a resource
// any functional role needs for its own job.
@Controller("admin/audit-log")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminAuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  findAll(@Query() query: ListAuditLogQuery) {
    return this.auditLogService.findAll(query);
  }
}
