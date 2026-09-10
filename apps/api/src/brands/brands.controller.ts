import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { BrandsService } from "./brands.service";
import { ListBrandsQuery } from "./dto/list-brands.query";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

// GET / is public (storefront brand filters). The write routes below are
// gated to PRODUCT_MANAGER/SUPER_ADMIN, same as vehicle/compatibility
// management (Section 21).
@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll(@Query() query: ListBrandsQuery) {
    return this.brandsService.findAll(query.productType);
  }

  @Get("admin")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  findAllAdmin() {
    return this.brandsService.findAllAdmin();
  }

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  archive(@Param("id") id: string) {
    return this.brandsService.archive(id);
  }
}
