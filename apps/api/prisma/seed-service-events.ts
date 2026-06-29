/** One-off: seed ServiceEvents so the owner Heat Map has real data (today). */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SPACES = [
  'Main Pool',
  'Beach Club',
  'Spa & Wellness',
  'Agave Kitchen',
  'Cinema Room',
  'Marina Dock',
  'Rooftop Terrace',
];

// 2-hour blocks (hour, label)
const BLOCKS: [number, string][] = [
  [6, '6 AM'],
  [8, '8 AM'],
  [10, '10 AM'],
  [12, '12 PM'],
  [14, '2 PM'],
  [16, '4 PM'],
  [18, '6 PM'],
  [20, '8 PM'],
  [22, '10 PM'],
];

const TYPE_BY_SPACE: Record<string, string> = {
  'Main Pool': 'OCEAN_ADVENTURE',
  'Beach Club': 'OCEAN_ADVENTURE',
  'Spa & Wellness': 'WELLNESS',
  'Agave Kitchen': 'CULINARY_AGAVE',
  'Cinema Room': 'PRIVATE',
  'Marina Dock': 'OCEAN_ADVENTURE',
  'Rooftop Terrace': 'CULINARY_AGAVE',
};

// Deterministic "busyness" — peak around midday/evening, quiet early.
function intensity(spaceIdx: number, blockIdx: number): number {
  const peak = [0, 0, 1, 3, 4, 3, 5, 4, 2][blockIdx] ?? 1;
  const spaceBias = [3, 2, 2, 4, 1, 2, 3][spaceIdx] ?? 1;
  return Math.max(0, Math.round((peak * spaceBias) / 2));
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clear today's events so this is idempotent.
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);
  await prisma.serviceEvent.deleteMany({
    where: { occurredAt: { gte: today, lte: dayEnd } },
  });

  const rows: {
    occurredAt: Date;
    timeBlock: string;
    estateSpace: string;
    serviceType: string;
    catalogCategory: string;
    hasCost: boolean;
  }[] = [];

  SPACES.forEach((space, si) => {
    BLOCKS.forEach(([hour, label], bi) => {
      const n = intensity(si, bi);
      for (let k = 0; k < n; k++) {
        const occurredAt = new Date(today);
        occurredAt.setHours(hour, 15 * k, 0, 0);
        rows.push({
          occurredAt,
          timeBlock: label,
          estateSpace: space,
          serviceType: TYPE_BY_SPACE[space],
          catalogCategory: TYPE_BY_SPACE[space],
          hasCost: space !== 'Main Pool' && space !== 'Beach Club',
        });
      }
    });
  });

  await prisma.serviceEvent.createMany({ data: rows });
  console.log(`Seeded ${rows.length} service events for today.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
