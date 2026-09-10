import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

// GET / is public (storefront category filters). The write routes below
// are gated to PRODUCT_MANAGER/SUPER_ADMIN, same as vehicle/compatibility
// management (Section 21).
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get("admin")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  archive(@Param("id") id: string) {
    return this.categoriesService.archive(id);
  }
}
