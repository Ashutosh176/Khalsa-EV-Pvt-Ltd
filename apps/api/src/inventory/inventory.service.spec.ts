import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { PrismaService } from "../prisma/prisma.service";

type Row = { id: string; [key: string]: unknown };
type AsyncFn<T> = (...args: unknown[]) => Promise<T>;
type AsyncMock<T> = Mock<AsyncFn<T>>;

function inventoryRow(overrides: Partial<Row> = {}): Row {
  return {
    id: "inv-1",
    currentStock: 10,
    reservedStock: 2,
    lowStockThreshold: 5,
    ...overrides,
  };
}

type MockTx = { inventory: { update: AsyncMock<Row> }; stockMovement: { create: AsyncMock<Row> } };
type MockPrisma = {
  inventory: { findMany: AsyncMock<Row[]>; findUnique: AsyncMock<Row | null> };
  $transaction: Mock;
};

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: MockPrisma;
  let tx: MockTx;

  beforeEach(() => {
    tx = {
      inventory: { update: jest.fn<AsyncFn<Row>>().mockResolvedValue(inventoryRow()) },
      stockMovement: { create: jest.fn<AsyncFn<Row>>().mockResolvedValue({ id: "sm-1" }) },
    };
    prisma = {
      inventory: {
        findMany: jest.fn<AsyncFn<Row[]>>().mockResolvedValue([]),
        findUnique: jest.fn<AsyncFn<Row | null>>().mockResolvedValue(inventoryRow()),
      },
      $transaction: jest.fn((arg: unknown) => (typeof arg === "function" ? arg(tx) : Promise.resolve(arg))),
    };
    service = new InventoryService(prisma as unknown as PrismaService);
  });

  describe("list", () => {
    it("computes availableStock and isLowStock from currentStock/reservedStock/threshold", async () => {
      prisma.inventory.findMany.mockResolvedValue([
        inventoryRow({ id: "inv-1", currentStock: 10, reservedStock: 2, lowStockThreshold: 5 }), // available 8, not low
        inventoryRow({ id: "inv-2", currentStock: 6, reservedStock: 2, lowStockThreshold: 5 }), // available 4, low
      ]);

      const result = await service.list({});

      expect(result.items.find((i) => i.id === "inv-1")).toMatchObject({ availableStock: 8, isLowStock: false });
      expect(result.items.find((i) => i.id === "inv-2")).toMatchObject({ availableStock: 4, isLowStock: true });
    });

    it("filters to only low-stock rows when lowStockOnly is set", async () => {
      prisma.inventory.findMany.mockResolvedValue([
        inventoryRow({ id: "inv-1", currentStock: 10, reservedStock: 2, lowStockThreshold: 5 }),
        inventoryRow({ id: "inv-2", currentStock: 6, reservedStock: 2, lowStockThreshold: 5 }),
      ]);

      const result = await service.list({ lowStockOnly: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe("inv-2");
      expect(result.total).toBe(1);
    });
  });

  describe("adjust", () => {
    it("rejects a decrease that would drop currentStock below reservedStock", async () => {
      prisma.inventory.findUnique.mockResolvedValue(inventoryRow({ currentStock: 10, reservedStock: 8 }));
      await expect(service.adjust("inv-1", { quantityChange: -5, reason: "damaged" })).rejects.toThrow(
        BadRequestException,
      );
      expect(tx.inventory.update).not.toHaveBeenCalled();
    });

    it("rejects a decrease that would make currentStock negative", async () => {
      prisma.inventory.findUnique.mockResolvedValue(inventoryRow({ currentStock: 3, reservedStock: 0 }));
      await expect(service.adjust("inv-1", { quantityChange: -10, reason: "damaged" })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects adjusting an inventory record that does not exist", async () => {
      prisma.inventory.findUnique.mockResolvedValue(null);
      await expect(service.adjust("missing", { quantityChange: 5, reason: "restock" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("records a RESTOCK movement for a positive adjustment", async () => {
      prisma.inventory.findUnique.mockResolvedValue(inventoryRow({ currentStock: 10, reservedStock: 2 }));
      await service.adjust("inv-1", { quantityChange: 5, reason: "New stock received" });
      expect(tx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentStock: 15 } }),
      );
      expect(tx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: "RESTOCK", quantity: 5 }) }),
      );
    });

    it("records an ADJUSTMENT movement for a negative adjustment", async () => {
      prisma.inventory.findUnique.mockResolvedValue(inventoryRow({ currentStock: 10, reservedStock: 2 }));
      await service.adjust("inv-1", { quantityChange: -3, reason: "Damaged in warehouse" });
      expect(tx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentStock: 7 } }),
      );
      expect(tx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: "ADJUSTMENT", quantity: 3 }) }),
      );
    });
  });
});
