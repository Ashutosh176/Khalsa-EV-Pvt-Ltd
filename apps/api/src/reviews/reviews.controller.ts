import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../auth/auth.types";
import { ReviewsService } from "./reviews.service";
import { CreateReviewDto } from "./dto/create-review.dto";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: JwtPayload) {
    return this.reviewsService.findAllMine(user.sub);
  }

  // Public: approved reviews (+ rating summary) for one product's page.
  @Get()
  findForProduct(@Query("productId") productId: string) {
    return this.reviewsService.findApprovedForProduct(productId);
  }
}
