type InventoryRow = { currentStock: number; reservedStock: number };

export function computeAvailableStock(inventory: InventoryRow[]): number {
  return inventory.reduce((sum, row) => sum + (row.currentStock - row.reservedStock), 0);
}
