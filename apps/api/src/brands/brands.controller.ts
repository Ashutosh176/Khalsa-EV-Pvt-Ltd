import { Controller, Get, Query } from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { ListBrandsQuery } from "./dto/list-brands.query";

@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  findAll(@Query() query: ListBrandsQuery) {
    return this.brandsService.findAll(query.productType);
  }
}
