import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListCatalogQuery } from "./dto/list-catalog.query";

const LIST_INCLUDE = {
  category: true,
  brand: true,
  images: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  inventory: true,
} satisfies Prisma.ProductInclude;

const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  compatibility: {
    include: { vehicleVariant: { include: { model: { include: { brand: true } } } }, vehicleYear: true },
  },
} satisfies Prisma.ProductInclude;

type ProductWithInventory = { inventory: { currentStock: number; reservedStock: number }[] };

function withStockSummary<T extends ProductWithInventory>(product: T) {
  const availableStock = product.inventory.reduce((sum, row) => sum + (row.currentStock - row.reservedStock), 0);
  const rest: Record<string, unknown> = { ...product };
  delete rest.inventory;
  return { ...rest, inStock: availableStock > 0, availableStock };
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListCatalogQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(query.vehicleVariantId ? { compatibility: { some: { vehicleVariantId: query.vehicleVariantId } } } : {}),
      ...(query.priceMin !== undefined || query.priceMax !== undefined
        ? { price: { gte: query.priceMin, lte: query.priceMax } }
        : {}),
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

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === "price_asc"
        ? { price: "asc" }
        : query.sort === "price_desc"
          ? { price: "desc" }
          : { createdAt: "desc" };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map(withStockSummary), total, page, pageSize };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.ACTIVE },
      include: DETAIL_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }
    return withStockSummary(product);
  }
}
