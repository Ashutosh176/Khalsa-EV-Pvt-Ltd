import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ListProductsQuery } from "./dto/list-products.query";

// Admin management endpoints. The public storefront reads from
// CatalogController at /products instead (Section 44 Phase 5).
@Controller("admin/products")
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListProductsQuery) {
    return this.productsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  archive(@Param("id") id: string) {
    return this.productsService.archive(id);
  }
}
