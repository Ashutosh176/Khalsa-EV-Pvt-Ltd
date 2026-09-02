import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleBrandDto } from "./dto/create-vehicle-brand.dto";
import { CreateVehicleModelDto } from "./dto/create-vehicle-model.dto";
import { CreateVehicleVariantDto } from "./dto/create-vehicle-variant.dto";
import { CreateVehicleYearDto } from "./dto/create-vehicle-year.dto";

// GET routes are public (the customer vehicle-compatibility finder,
// Section 10, needs to browse brand -> model -> variant -> year without
// authenticating). POST routes are gated per-method to PRODUCT_MANAGER/
// SUPER_ADMIN, since Section 21 folds vehicle/compatibility management
// under PRODUCT_MANAGER rather than a separate role.
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get("brands")
  listBrands() {
    return this.vehiclesService.listBrands();
  }

  @Post("brands")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  createBrand(@Body() dto: CreateVehicleBrandDto) {
    return this.vehiclesService.createBrand(dto);
  }

  @Get("models")
  listModels(@Query("vehicleBrandId") vehicleBrandId: string) {
    return this.vehiclesService.listModels(vehicleBrandId);
  }

  @Post("models")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  createModel(@Body() dto: CreateVehicleModelDto) {
    return this.vehiclesService.createModel(dto);
  }

  @Get("variants")
  listVariants(@Query("vehicleModelId") vehicleModelId: string) {
    return this.vehiclesService.listVariants(vehicleModelId);
  }

  @Post("variants")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  createVariant(@Body() dto: CreateVehicleVariantDto) {
    return this.vehiclesService.createVariant(dto);
  }

  @Get("years")
  listYears(@Query("vehicleVariantId") vehicleVariantId: string) {
    return this.vehiclesService.listYears(vehicleVariantId);
  }

  @Post("years")
  @UseGuards(AdminAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.PRODUCT_MANAGER)
  createYear(@Body() dto: CreateVehicleYearDto) {
    return this.vehiclesService.createYear(dto);
  }
}
