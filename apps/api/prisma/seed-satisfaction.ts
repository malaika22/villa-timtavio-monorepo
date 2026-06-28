/** One-off: seed satisfaction reviews so the owner Satisfaction page has data. */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Spread across recent months with realistic category spreads.
const ROWS = [
  { overall: 5, cleanliness: 5, staff: 5, experiences: 5, privacy: 5, value: 4, arrival: 5, monthsAgo: 5, comment: 'Flawless stay, staff anticipated everything.' },
  { overall: 5, cleanliness: 5, staff: 5, experiences: 4, privacy: 5, value: 4, arrival: 4, monthsAgo: 4, comment: 'Incredible privacy and service.' },
  { overall: 4, cleanliness: 5, staff: 4, experiences: 4, privacy: 5, value: 3, arrival: 4, monthsAgo: 4, comment: 'Loved it; pricing felt steep for add-ons.' },
  { overall: 5, cleanliness: 5, staff: 5, experiences: 5, privacy: 5, value: 4, arrival: 5, monthsAgo: 3, comment: 'Chef experiences were the highlight.' },
  { overall: 4, cleanliness: 4, staff: 5, experiences: 5, privacy: 4, value: 4, arrival: 3, monthsAgo: 2, comment: 'Arrival was a touch slow but recovered well.' },
  { overall: 5, cleanliness: 5, staff: 5, experiences: 5, privacy: 5, value: 5, arrival: 5, monthsAgo: 1, comment: 'Best villa stay we have ever had.' },
  { overall: 4, cleanliness: 5, staff: 4, experiences: 4, privacy: 5, value: 4, arrival: 4, monthsAgo: 1, comment: 'Very strong across the board.' },
  { overall: 5, cleanliness: 5, staff: 5, experiences: 4, privacy: 5, value: 4, arrival: 5, monthsAgo: 0, comment: 'Will absolutely return.' },
];

async function main() {
  const existing = await prisma.satisfactionReview.count();
  if (existing > 0) {
    console.log(`Satisfaction already has ${existing} reviews — skipping.`);
    return;
  }
  const now = new Date();
  for (const r of ROWS) {
    const createdAt = new Date(now);
    createdAt.setMonth(createdAt.getMonth() - r.monthsAgo);
    const { monthsAgo: _omit, ...data } = r;
    void _omit;
    await prisma.satisfactionReview.create({ data: { ...data, createdAt } });
  }
  console.log(`Seeded ${ROWS.length} satisfaction reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
