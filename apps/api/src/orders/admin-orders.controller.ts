import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { OrdersService } from "./orders.service";
import { ListOrdersQuery } from "./dto/list-orders.query";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { UpdateShipmentDto } from "../shipping/dto/update-shipment.dto";

@Controller("admin/orders")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ORDER_MANAGER)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: ListOrdersQuery) {
    return this.ordersService.findAllAdmin(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatusAdmin(id, dto);
  }

  @Patch(":id/shipment")
  updateShipment(@Param("id") id: string, @Body() dto: UpdateShipmentDto) {
    return this.ordersService.updateShipmentAdmin(id, dto);
  }
}
