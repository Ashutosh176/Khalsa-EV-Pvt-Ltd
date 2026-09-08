import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/auth.types";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.ordersService.findAll(user.sub);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ordersService.findOne(user.sub, id);
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: CancelOrderDto) {
    return this.ordersService.cancel(user.sub, id, dto.reason);
  }

  @Post(":id/pay")
  initiatePayment(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ordersService.initiatePayment(user.sub, id);
  }

  @Post(":id/verify-payment")
  verifyPayment(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: VerifyPaymentDto) {
    return this.ordersService.verifyPayment(user.sub, id, dto);
  }
}
