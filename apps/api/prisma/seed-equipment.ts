/** One-off: seed Equipment for the owner buy-vs-rent capital analysis. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROWS = [
  { name: 'Jet Ski (pair)', category: 'Water Sports', rentalCostPerUse: 320, purchasePrice: 18000, totalUses: 41, estimatedAnnualMaintenanceCost: 1400, seasonalNotes: 'Peak Dec–Apr; near-daily in high season.' },
  { name: 'Paddleboard set', category: 'Water Sports', rentalCostPerUse: 60, purchasePrice: 2400, totalUses: 52, estimatedAnnualMaintenanceCost: 200, seasonalNotes: 'Steady year-round.' },
  { name: 'Cinema projector + screen', category: 'Entertainment', rentalCostPerUse: 180, purchasePrice: 6500, totalUses: 22, estimatedAnnualMaintenanceCost: 300, seasonalNotes: 'Mostly evenings, all seasons.' },
  { name: 'Wood-fired pizza oven', category: 'Culinary', rentalCostPerUse: 240, purchasePrice: 5200, totalUses: 14, estimatedAnnualMaintenanceCost: 250, seasonalNotes: 'Event-driven.' },
  { name: 'E-bike fleet (6)', category: 'Excursion', rentalCostPerUse: 140, purchasePrice: 9000, totalUses: 19, estimatedAnnualMaintenanceCost: 900, seasonalNotes: 'Cooler months.' },
  { name: 'Outdoor sound system', category: 'Entertainment', rentalCostPerUse: 110, purchasePrice: 3000, totalUses: 33, estimatedAnnualMaintenanceCost: 150, seasonalNotes: 'Frequent for events.' },
];

async function main() {
  await prisma.equipment.deleteMany({});
  for (const r of ROWS) {
    await prisma.equipment.create({
      data: {
        ...r,
        totalRentalCost: r.rentalCostPerUse * r.totalUses,
      },
    });
  }
  console.log(`Seeded ${ROWS.length} equipment items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
