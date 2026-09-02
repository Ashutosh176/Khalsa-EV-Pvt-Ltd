import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/auth.types";
import { WishlistService } from "./wishlist.service";
import { AddWishlistItemDto } from "./dto/add-wishlist-item.dto";

@Controller("wishlist")
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser() user: JwtPayload) {
    return this.wishlistService.getWishlist(user.sub);
  }

  @Post("items")
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddWishlistItemDto) {
    return this.wishlistService.addItem(user.sub, dto);
  }

  @Delete("items/:id")
  removeItem(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.wishlistService.removeItem(user.sub, id);
  }

  @Post("items/:id/move-to-cart")
  moveToCart(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.wishlistService.moveToCart(user.sub, id);
  }
}
