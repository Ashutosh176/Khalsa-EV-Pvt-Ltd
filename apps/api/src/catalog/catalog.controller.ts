import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { ListCatalogQuery } from "./dto/list-catalog.query";

// Public customer-facing storefront reads only - no auth guard. Admin
// mutation endpoints live at /admin/products (ProductsController).
@Controller("products")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll(@Query() query: ListCatalogQuery) {
    return this.catalogService.findAll(query);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.catalogService.findBySlug(slug);
  }
}
