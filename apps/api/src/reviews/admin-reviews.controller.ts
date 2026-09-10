import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ReviewsService } from "./reviews.service";
import { ListAdminReviewsQuery } from "./dto/list-admin-reviews.query";

@Controller("admin/reviews")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.SUPPORT_MANAGER)
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(@Query() query: ListAdminReviewsQuery) {
    return this.reviewsService.findAllAdmin(query);
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string) {
    return this.reviewsService.approve(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reviewsService.remove(id);
  }
}
