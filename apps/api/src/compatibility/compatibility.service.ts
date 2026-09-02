import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { isUniqueConstraintError } from "../common/prisma-error";
import { CreateCompatibilityDto } from "./dto/create-compatibility.dto";
import { BulkCreateCompatibilityDto } from "./dto/bulk-create-compatibility.dto";
import { ListCompatibilityQuery } from "./dto/list-compatibility.query";

const VEHICLE_INCLUDE = {
  vehicleVariant: { include: { model: { include: { brand: true } } } },
  vehicleYear: true,
} as const;

const PRODUCT_SUMMARY_INCLUDE = {
  product: { select: { id: true, name: true, slug: true, sku: true, status: true } },
} as const;

@Injectable()
export class CompatibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompatibilityDto) {
    await this.requireProduct(dto.productId);
    await this.requireVariant(dto.vehicleVariantId);
    if (dto.vehicleYearId) {
      await this.requireYearBelongsToVariant(dto.vehicleYearId, dto.vehicleVariantId);
    }

    try {
      return await this.prisma.productCompatibility.create({
        data: {
          productId: dto.productId,
          vehicleVariantId: dto.vehicleVariantId,
          vehicleYearId: dto.vehicleYearId,
          notes: dto.notes,
        },
        include: VEHICLE_INCLUDE,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException("This product is already mapped to that vehicle");
      }
      throw error;
    }
  }

  async bulkCreate(dto: BulkCreateCompatibilityDto) {
    await this.requireProduct(dto.productId);

    const variants = await this.prisma.vehicleVariant.findMany({
      where: { id: { in: dto.vehicleVariantIds } },
      select: { id: true },
    });
    const foundIds = new Set(variants.map((v) => v.id));
    const missing = dto.vehicleVariantIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown vehicleVariantId(s): ${missing.join(", ")}`);
    }

    const result = await this.prisma.productCompatibility.createMany({
      data: dto.vehicleVariantIds.map((vehicleVariantId) => ({
        productId: dto.productId,
        vehicleVariantId,
      })),
      skipDuplicates: true,
    });

    return { created: result.count, requested: dto.vehicleVariantIds.length };
  }

  findAll(query: ListCompatibilityQuery) {
    if (!query.productId && !query.vehicleVariantId) {
      throw new BadRequestException("Provide productId or vehicleVariantId to filter compatibility mappings");
    }

    return this.prisma.productCompatibility.findMany({
      where: {
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.vehicleVariantId ? { vehicleVariantId: query.vehicleVariantId } : {}),
      },
      include: query.productId ? VEHICLE_INCLUDE : PRODUCT_SUMMARY_INCLUDE,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.productCompatibility.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Compatibility mapping ${id} not found`);
    }
    await this.prisma.productCompatibility.delete({ where: { id } });
    return { status: "ok" };
  }

  private async requireProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new BadRequestException("productId does not reference an existing product");
    return product;
  }

  private async requireVariant(id: string) {
    const variant = await this.prisma.vehicleVariant.findUnique({ where: { id } });
    if (!variant) throw new BadRequestException("vehicleVariantId does not reference an existing vehicle variant");
    return variant;
  }

  private async requireYearBelongsToVariant(yearId: string, vehicleVariantId: string) {
    const year = await this.prisma.vehicleYear.findUnique({ where: { id: yearId } });
    if (!year || year.vehicleVariantId !== vehicleVariantId) {
      throw new BadRequestException("vehicleYearId does not belong to the given vehicleVariantId");
    }
    return year;
  }
}
