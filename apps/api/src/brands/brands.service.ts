import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductType } from "@prisma/client";
import { slugify } from "@khalsa-ev/utils";
import { PrismaService } from "../prisma/prisma.service";
import { isUniqueConstraintError } from "../common/prisma-error";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(productType?: ProductType) {
    return this.prisma.brand.findMany({
      where: {
        isActive: true,
        ...(productType ? { products: { some: { productType } } } : {}),
      },
      orderBy: { name: "asc" },
    });
  }

  // Admin management view - includes deactivated brands, which the public
  // storefront list above must never surface.
  findAllAdmin() {
    return this.prisma.brand.findMany({ orderBy: { name: "asc" } });
  }

  async create(dto: CreateBrandDto) {
    const slug = await this.generateUniqueSlug(dto.slug ?? dto.name);
    return this.prisma.brand.create({
      data: { name: dto.name, slug, logoUrl: dto.logoUrl, description: dto.description },
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.requireBrand(id);

    try {
      return await this.prisma.brand.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          logoUrl: dto.logoUrl,
          description: dto.description,
          isActive: dto.isActive,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "slug")) {
        throw new BadRequestException(`A brand with slug "${dto.slug}" already exists`);
      }
      throw error;
    }
  }

  // Soft delete: products reference brands by id, so a brand in use is
  // hidden from the storefront rather than removed (same rationale as
  // ProductsService.archive and CategoriesService.archive).
  async archive(id: string) {
    await this.requireBrand(id);
    return this.prisma.brand.update({ where: { id }, data: { isActive: false } });
  }

  private async requireBrand(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand ${id} not found`);
    }
    return brand;
  }

  private async generateUniqueSlug(source: string): Promise<string> {
    const base = slugify(source);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.brand.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
