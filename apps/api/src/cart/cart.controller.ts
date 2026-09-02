import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/auth.types";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.sub);
  }

  @Post("items")
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch("items/:id")
  updateItem(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(user.sub, id, dto);
  }

  @Delete("items/:id")
  removeItem(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cartService.removeItem(user.sub, id);
  }
}
