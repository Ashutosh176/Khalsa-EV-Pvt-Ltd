import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListInventoryQuery } from "./dto/list-inventory.query";
import { AdjustInventoryDto } from "./dto/adjust-inventory.dto";

const INVENTORY_INCLUDE = {
  product: { select: { id: true, name: true, sku: true, slug: true } },
  variant: { select: { id: true, sku: true, color: true } },
  warehouse: { select: { id: true, name: true, code: true } },
} satisfies Prisma.InventoryInclude;

function withComputedStock<T extends { currentStock: number; reservedStock: number; lowStockThreshold: number }>(
  row: T,
) {
  const availableStock = row.currentStock - row.reservedStock;
  return { ...row, availableStock, isLowStock: availableStock <= row.lowStockThreshold };
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Low-stock filtering and pagination happen in JS after the DB query
  // rather than in SQL, since "available stock" is a cross-column
  // computation (currentStock - reservedStock) Prisma's `where` can't
  // express - acceptable for a single-warehouse, realistically-sized
  // spare-parts catalog (Section 45: keep it simple).
  async list(query: ListInventoryQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const where: Prisma.InventoryWhereInput = query.search
      ? {
          OR: [
            { product: { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
            { product: { sku: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
            { variant: { sku: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
          ],
        }
      : {};

    const rows = await this.prisma.inventory.findMany({
      where,
      include: INVENTORY_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });

    const withStock = rows.map(withComputedStock);
    const filtered = query.lowStockOnly ? withStock.filter((row) => row.isLowStock) : withStock;
    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    return { items, total, page, pageSize };
  }

  async adjust(inventoryId: string, dto: AdjustInventoryDto) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) {
      throw new NotFoundException(`Inventory record ${inventoryId} not found`);
    }

    const nextCurrentStock = inventory.currentStock + dto.quantityChange;
    if (nextCurrentStock < inventory.reservedStock) {
      throw new BadRequestException("Cannot reduce stock below what is already reserved for pending orders");
    }
    if (nextCurrentStock < 0) {
      throw new BadRequestException("Stock cannot go negative");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { id: inventoryId },
        data: { currentStock: nextCurrentStock },
        include: INVENTORY_INCLUDE,
      });
      await tx.stockMovement.create({
        data: {
          inventoryId,
          type: dto.quantityChange > 0 ? "RESTOCK" : "ADJUSTMENT",
          quantity: Math.abs(dto.quantityChange),
          reason: dto.reason,
        },
      });
      return withComputedStock(updated);
    });
  }
}
