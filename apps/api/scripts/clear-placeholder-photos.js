#!/usr/bin/env node
/**
 * Takes back the photograph the CSV import invented.
 *
 *   node /app/apps/api/scripts/clear-placeholder-photos.js          # dry run
 *   node /app/apps/api/scripts/clear-placeholder-photos.js --apply
 *
 * Bulk import used to write the same stock URL onto every row, so an
 * experience nobody had photographed still carried a real primaryPhotoUrl
 * pointing at a picture of somewhere else — and the estate had to delete a
 * photo it never added, one experience at a time. The import no longer does
 * that; this clears the ones it already did.
 *
 * Only the known placeholder is touched, matched exactly. Anything actually
 * uploaded is left alone, which is why this looks for specific URLs rather
 * than anything that smells like a default.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

/**
 * Every spelling the import has used.
 *
 * DEFAULT_EXPERIENCE_IMAGE_URL was overridable by environment, so if the
 * estate ever set it, add that value here before running.
 */
const PLACEHOLDERS = new Set(
  [
    'https://villa-timtavio-monorepo-pwa.vercel.app/images/experience.png',
    '/images/experience.png',
    process.env.DEFAULT_EXPERIENCE_IMAGE_URL,
  ].filter(Boolean),
);

const isPlaceholder = (url) => typeof url === 'string' && PLACEHOLDERS.has(url);

(async () => {
  console.log(
    APPLY
      ? '\nAPPLYING.\n'
      : '\nDRY RUN — nothing will change. Re-run with --apply.\n',
  );
  console.log('  Treating these as placeholders:');
  PLACEHOLDERS.forEach((u) => console.log(`    ${u}`));
  console.log('');

  const items = await prisma.catalogItem.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, primaryPhotoUrl: true, photoUrls: true },
    orderBy: { name: 'asc' },
  });

  let touched = 0;
  let real = 0;
  let empty = 0;

  for (const item of items) {
    const keptGallery = (item.photoUrls ?? []).filter((u) => !isPlaceholder(u));
    const clearPrimary = isPlaceholder(item.primaryPhotoUrl);
    const droppedFromGallery = (item.photoUrls ?? []).length - keptGallery.length;

    if (!clearPrimary && droppedFromGallery === 0) {
      if (item.primaryPhotoUrl || (item.photoUrls ?? []).length > 0) real++;
      else empty++;
      continue;
    }

    // A gallery photo may be real even when the cover is the placeholder, so
    // the cover falls back to whatever survives rather than straight to null.
    const nextPrimary = clearPrimary
      ? (keptGallery[0] ?? null)
      : item.primaryPhotoUrl;

    touched++;
    console.log(
      `  ✓  ${item.name.padEnd(38)} ` +
        (clearPrimary ? 'cover cleared' : 'cover kept') +
        (droppedFromGallery ? `, ${droppedFromGallery} from gallery` : '') +
        (nextPrimary ? ' → promoted a real photo' : ''),
    );

    if (APPLY) {
      await prisma.catalogItem.update({
        where: { id: item.id },
        data: { primaryPhotoUrl: nextPrimary, photoUrls: keptGallery },
      });
    }
  }

  console.log(
    `\n  ${touched} to clear, ${real} with real photographs left alone, ` +
      `${empty} already without one.\n`,
  );
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
