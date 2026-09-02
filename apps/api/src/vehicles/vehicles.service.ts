import { BadRequestException, Injectable } from "@nestjs/common";
import { slugify } from "@khalsa-ev/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVehicleBrandDto } from "./dto/create-vehicle-brand.dto";
import { CreateVehicleModelDto } from "./dto/create-vehicle-model.dto";
import { CreateVehicleVariantDto } from "./dto/create-vehicle-variant.dto";
import { CreateVehicleYearDto } from "./dto/create-vehicle-year.dto";

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  listBrands() {
    return this.prisma.vehicleBrand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createBrand(dto: CreateVehicleBrandDto) {
    const slug = await this.generateUniqueBrandSlug(dto.slug ?? dto.name);
    return this.prisma.vehicleBrand.create({
      data: { name: dto.name, slug, logoUrl: dto.logoUrl },
    });
  }

  async listModels(vehicleBrandId: string) {
    await this.requireBrand(vehicleBrandId);
    return this.prisma.vehicleModel.findMany({
      where: { vehicleBrandId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createModel(dto: CreateVehicleModelDto) {
    await this.requireBrand(dto.vehicleBrandId);
    const slug = await this.generateUniqueModelSlug(dto.vehicleBrandId, dto.slug ?? dto.name);
    return this.prisma.vehicleModel.create({
      data: { vehicleBrandId: dto.vehicleBrandId, name: dto.name, slug },
    });
  }

  async listVariants(vehicleModelId: string) {
    await this.requireModel(vehicleModelId);
    return this.prisma.vehicleVariant.findMany({
      where: { vehicleModelId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createVariant(dto: CreateVehicleVariantDto) {
    await this.requireModel(dto.vehicleModelId);
    return this.prisma.vehicleVariant.create({
      data: { vehicleModelId: dto.vehicleModelId, name: dto.name },
    });
  }

  async listYears(vehicleVariantId: string) {
    await this.requireVariant(vehicleVariantId);
    return this.prisma.vehicleYear.findMany({
      where: { vehicleVariantId },
      orderBy: { year: "desc" },
    });
  }

  async createYear(dto: CreateVehicleYearDto) {
    await this.requireVariant(dto.vehicleVariantId);
    return this.prisma.vehicleYear.create({
      data: { vehicleVariantId: dto.vehicleVariantId, year: dto.year },
    });
  }

  private async requireBrand(id: string) {
    const brand = await this.prisma.vehicleBrand.findUnique({ where: { id } });
    if (!brand) throw new BadRequestException("vehicleBrandId does not reference an existing vehicle brand");
    return brand;
  }

  private async requireModel(id: string) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id } });
    if (!model) throw new BadRequestException("vehicleModelId does not reference an existing vehicle model");
    return model;
  }

  private async requireVariant(id: string) {
    const variant = await this.prisma.vehicleVariant.findUnique({ where: { id } });
    if (!variant) throw new BadRequestException("vehicleVariantId does not reference an existing vehicle variant");
    return variant;
  }

  private async generateUniqueBrandSlug(source: string): Promise<string> {
    const base = slugify(source);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.vehicleBrand.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async generateUniqueModelSlug(vehicleBrandId: string, source: string): Promise<string> {
    const base = slugify(source);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.vehicleModel.findFirst({ where: { vehicleBrandId, slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
