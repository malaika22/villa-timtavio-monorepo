/**
 * QA cleanup — clears TRANSACTIONAL test data so QA can start from a clean slate.
 *
 * KEEPS (config/reference): CatalogItem, ExperienceCategory, Vendor, Room,
 * MenuItem, Recommendation, InventoryItem, Equipment, EstateSettings.
 * DELETES (test artifacts): bookings, guests, manifest, inquiries, experience
 * requests, folio items, magic tokens, alerts, audit logs.
 *
 * Run (from apps/api):
 *   - On Render API shell (DATABASE_URL already set):  npx tsx prisma/cleanup-test-data.ts
 *   - Locally against the EXTERNAL db url:
 *       DATABASE_URL="<render external url>" npx tsx prisma/cleanup-test-data.ts
 *
 * Pass --all to ALSO wipe the experience catalog + categories + vendors
 * (full reset) — omit it to keep the catalog you uploaded.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const wipeCatalog = process.argv.includes('--all');

async function main() {
  console.log(
    `QA cleanup — ${wipeCatalog ? 'FULL reset (incl. catalog)' : 'keeping catalog/config'}\n`,
  );

  // Deleted in FK-dependency order (children first).
  const steps: [string, () => Promise<{ count: number }>][] = [
    ['vendorRating', () => prisma.vendorRating.deleteMany()],
    ['experienceRequest', () => prisma.experienceRequest.deleteMany()],
    ['folioItem', () => prisma.folioItem.deleteMany()],
    ['manifestGuest', () => prisma.manifestGuest.deleteMany()],
    ['manifestDraft', () => prisma.manifestDraft.deleteMany()],
    ['magicToken', () => prisma.magicToken.deleteMany()],
    ['inquiry', () => prisma.inquiry.deleteMany()],
    ['booking', () => prisma.booking.deleteMany()],
    ['crmNote', () => prisma.crmNote.deleteMany()],
    ['guest', () => prisma.guest.deleteMany()],
    ['systemAlert', () => prisma.systemAlert.deleteMany()],
    ['auditLog', () => prisma.auditLog.deleteMany()],
  ];

  if (wipeCatalog) {
    steps.push(
      ['catalogItem', () => prisma.catalogItem.deleteMany()],
      ['experienceCategory', () => prisma.experienceCategory.deleteMany()],
      ['vendor', () => prisma.vendor.deleteMany()],
    );
  }

  for (const [name, fn] of steps) {
    const { count } = await fn();
    console.log(`  ${name.padEnd(20)} deleted ${count}`);
  }
  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
