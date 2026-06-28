/** One-off: seed inventory so the EM Inventory page has data. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ITEMS = [
  { name: 'Champagne (Veuve)', category: 'BEVERAGES', unit: 'bottles', currentStock: 4, reorderThreshold: 6, maxStock: 24 },
  { name: 'Sparkling Water', category: 'BEVERAGES', unit: 'bottles', currentStock: 40, reorderThreshold: 12, maxStock: 60 },
  { name: 'Espresso Beans', category: 'CULINARY', unit: 'kg', currentStock: 2, reorderThreshold: 3, maxStock: 10 },
  { name: 'Pool Towels', category: 'LINENS', unit: 'units', currentStock: 28, reorderThreshold: 16, maxStock: 48 },
  { name: 'Bath Towels', category: 'LINENS', unit: 'units', currentStock: 12, reorderThreshold: 16, maxStock: 48 },
  { name: 'Hand Soap (refill)', category: 'TOILETRIES', unit: 'litres', currentStock: 0, reorderThreshold: 2, maxStock: 8 },
  { name: 'Sunscreen SPF50', category: 'TOILETRIES', unit: 'units', currentStock: 9, reorderThreshold: 4, maxStock: 12 },
  { name: 'Snorkel Sets', category: 'EQUIPMENT', unit: 'sets', currentStock: 6, reorderThreshold: 4, maxStock: 10 },
];

async function main() {
  const count = await prisma.inventoryItem.count();
  if (count > 0) {
    console.log(`Inventory already has ${count} items — skipping.`);
    return;
  }
  for (const item of ITEMS) {
    await prisma.inventoryItem.create({ data: item as never });
  }
  console.log(`Seeded ${ITEMS.length} inventory items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
