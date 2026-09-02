import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus, ProductType } from "@prisma/client";
import { slugify } from "@khalsa-ev/utils";
import { PrismaService } from "../prisma/prisma.service";
import { isUniqueConstraintError } from "../common/prisma-error";
import { DEFAULT_WAREHOUSE_CODE } from "../common/constants";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ListProductsQuery } from "./dto/list-products.query";

const PRODUCT_INCLUDE = {
  category: true,
  brand: true,
  images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  inventory: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    if (dto.price > dto.mrp) {
      throw new BadRequestException("price cannot be greater than mrp");
    }

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new BadRequestException("categoryId does not reference an existing category");
    }

    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand) {
        throw new BadRequestException("brandId does not reference an existing brand");
      }
    }

    const slug = await this.generateUniqueSlug(dto.slug ?? dto.name);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            slug,
            sku: dto.sku,
            partNumber: dto.partNumber,
            name: dto.name,
            description: dto.description,
            productType: dto.productType ?? ProductType.SPARE_PART,
            status: dto.status ?? ProductStatus.DRAFT,
            categoryId: dto.categoryId,
            brandId: dto.brandId,
            price: dto.price,
            mrp: dto.mrp,
            gstPercent: dto.gstPercent ?? 0,
            warrantyMonths: dto.warrantyMonths,
            specifications: dto.specifications as Prisma.InputJsonValue | undefined,
            seoTitle: dto.seoTitle,
            seoDescription: dto.seoDescription,
            isFeatured: dto.isFeatured ?? false,
          },
        });

        const warehouse = await tx.warehouse.findUnique({ where: { code: DEFAULT_WAREHOUSE_CODE } });
        if (!warehouse) {
          // Seeded by prisma/seed.ts - a missing warehouse means the
          // database was never seeded, not a state to silently work
          // around by skipping inventory tracking for this product.
          throw new Error(
            `Default warehouse "${DEFAULT_WAREHOUSE_CODE}" not found. Run "pnpm --filter @khalsa-ev/api db:seed".`,
          );
        }

        const inventory = await tx.inventory.create({
          data: {
            warehouseId: warehouse.id,
            productId: product.id,
            currentStock: dto.initialStock ?? 0,
          },
        });
        if (dto.initialStock) {
          await tx.stockMovement.create({
            data: {
              inventoryId: inventory.id,
              type: "RESTOCK",
              quantity: dto.initialStock,
              reason: "Initial stock on product creation",
            },
          });
        }

        // Re-fetch with the include: the `product` object above was
        // materialized before its Inventory row existed, so it would
        // otherwise come back with inventory: [] despite the row
        // being created moments later in this same transaction.
        return tx.product.findUniqueOrThrow({ where: { id: product.id }, include: PRODUCT_INCLUDE });
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "sku")) {
        throw new ConflictException(`A product with SKU "${dto.sku}" already exists`);
      }
      if (isUniqueConstraintError(error, "slug")) {
        throw new ConflictException(`A product with slug "${slug}" already exists`);
      }
      throw error;
    }
  }

  async findAll(query: ListProductsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.productType ? { productType: query.productType } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { sku: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { partNumber: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.price !== undefined || dto.mrp !== undefined) {
      const current = await this.prisma.product.findUniqueOrThrow({ where: { id } });
      const nextPrice = dto.price ?? current.price;
      const nextMrp = dto.mrp ?? current.mrp;
      if (nextPrice > nextMrp) {
        throw new BadRequestException("price cannot be greater than mrp");
      }
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          slug: dto.slug,
          sku: dto.sku,
          partNumber: dto.partNumber,
          name: dto.name,
          description: dto.description,
          productType: dto.productType,
          status: dto.status,
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          price: dto.price,
          mrp: dto.mrp,
          gstPercent: dto.gstPercent,
          warrantyMonths: dto.warrantyMonths,
          specifications: dto.specifications as Prisma.InputJsonValue | undefined,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          isFeatured: dto.isFeatured,
        },
        include: PRODUCT_INCLUDE,
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "sku")) {
        throw new ConflictException(`A product with SKU "${dto.sku}" already exists`);
      }
      if (isUniqueConstraintError(error, "slug")) {
        throw new ConflictException(`A product with slug "${dto.slug}" already exists`);
      }
      throw error;
    }
  }

  // Soft delete: catalog items with order history must never be hard
  // removed, and OrderItem.product has no cascading delete for exactly
  // this reason (Section 23 "delete/deactivate").
  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
      include: PRODUCT_INCLUDE,
    });
  }

  private async generateUniqueSlug(source: string): Promise<string> {
    const base = slugify(source);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.product.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
