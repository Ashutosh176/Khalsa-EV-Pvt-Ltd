import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/auth.types";
import { CouponsService } from "./coupons.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { ValidateCouponDto } from "./dto/validate-coupon.dto";

@Controller("coupons")
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // Customer-facing: preview a code's discount against their own cart
  // before checkout. Order creation (OrdersService) re-validates
  // independently - this is a convenience, not the source of truth.
  @Post("validate")
  @UseGuards(JwtAuthGuard)
  validate(@CurrentUser() user: JwtPayload, @Body() dto: ValidateCouponDto) {
    return this.couponsService.previewForCart(user.sub, dto.code);
  }

  @Get()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ORDER_MANAGER)
  findAll() {
    return this.couponsService.findAllAdmin();
  }

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ORDER_MANAGER)
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ORDER_MANAGER)
  update(@Param("id") id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ORDER_MANAGER)
  archive(@Param("id") id: string) {
    return this.couponsService.archive(id);
  }
}
