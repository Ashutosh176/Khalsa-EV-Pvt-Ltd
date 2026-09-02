import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { InventoryService } from "./inventory.service";
import { ListInventoryQuery } from "./dto/list-inventory.query";
import { AdjustInventoryDto } from "./dto/adjust-inventory.dto";

@Controller("admin/inventory")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.INVENTORY_MANAGER)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  list(@Query() query: ListInventoryQuery) {
    return this.inventoryService.list(query);
  }

  @Patch(":id/adjust")
  adjust(@Param("id") id: string, @Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(id, dto);
  }
}
