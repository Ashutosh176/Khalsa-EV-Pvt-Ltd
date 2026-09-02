import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CompatibilityService } from "./compatibility.service";
import { CreateCompatibilityDto } from "./dto/create-compatibility.dto";
import { BulkCreateCompatibilityDto } from "./dto/bulk-create-compatibility.dto";
import { ListCompatibilityQuery } from "./dto/list-compatibility.query";

// GET is public: both the product detail page ("compatible with...")
// and the vehicle-compatibility finder ("parts for my vehicle") need
// unauthenticated read access. Mutations are admin-only.
@Controller("compatibility")
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Get()
  findAll(@Query() query: ListCompatibilityQuery) {
    return this.compatibilityService.findAll(query);
  }

  @Post()
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  create(@Body() dto: CreateCompatibilityDto) {
    return this.compatibilityService.create(dto);
  }

  @Post("bulk")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  bulkCreate(@Body() dto: BulkCreateCompatibilityDto) {
    return this.compatibilityService.bulkCreate(dto);
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  remove(@Param("id") id: string) {
    return this.compatibilityService.remove(id);
  }
}
