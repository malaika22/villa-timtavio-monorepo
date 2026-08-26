#!/usr/bin/env node
/**
 * Gives the categories that already exist a mark to wear.
 *
 *   node /app/apps/api/scripts/seed-category-glyphs.js          # dry run
 *   node /app/apps/api/scripts/seed-category-glyphs.js --apply
 *   node /app/apps/api/scripts/seed-category-glyphs.js --apply --overwrite
 *
 * Matched on slug, because a name can be edited and a slug can't. Anything
 * the estate has already chosen by hand is left alone unless --overwrite says
 * otherwise: the point of the picker is that Rodrigo's answer beats mine.
 *
 * A category not listed here is reported and skipped rather than guessed at.
 * "The Fleet" means a boat because somebody at the villa decided it does, and
 * there is no rule that gets there on its own — which is the whole reason the
 * glyph is a column rather than a lookup.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const OVERWRITE = process.argv.includes('--overwrite');

/** Kept in step with EXPERIENCE_GLYPHS in packages/ui by hand. */
const KNOWN = [
  'waves',
  'boat',
  'agave',
  'wine',
  'steam',
  'provisions',
  'temple',
  'path',
  'peak',
  'key',
  'mark',
];

/**
 * The eight the estate has today, and why each gets what it gets.
 *
 * Slugs come from slugifyCategory in catalog.service.ts: lowercased, and every
 * run of non-alphanumerics collapsed to a hyphen. So "Billionaire's Pantry"
 * becomes billionaire-s-pantry, apostrophe and all.
 */
const BY_SLUG = {
  'the-fleet': 'boat',
  'raw-pacific': 'waves',
  'culinary-agave': 'agave',
  'reserve-cellar': 'wine',
  'vanguard-wellness': 'steam',
  'billionaire-s-pantry': 'provisions',
  'oaxaca-immersions': 'temple',
  'arrival-the-vibe': 'path',
};

(async () => {
  console.log(
    APPLY
      ? `\nAPPLYING${OVERWRITE ? ' — overwriting glyphs already chosen' : ''}.\n`
      : '\nDRY RUN — nothing will change. Re-run with --apply.\n',
  );

  const bad = Object.entries(BY_SLUG).filter(([, g]) => !KNOWN.includes(g));
  if (bad.length > 0) {
    console.error('Unknown glyph name(s):', bad.map(([s, g]) => `${s}=${g}`));
    process.exit(1);
  }

  const categories = await prisma.experienceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true, glyph: true },
  });

  if (categories.length === 0) {
    console.log('  No experience categories exist.');
    return;
  }

  let set = 0;
  let kept = 0;
  let unmatched = 0;

  for (const c of categories) {
    const wanted = BY_SLUG[c.slug];
    const label = `${c.name} (${c.slug})`.padEnd(42);

    if (!wanted) {
      unmatched++;
      console.log(`  ?  ${label} not in this script — pick one in the dashboard`);
      continue;
    }
    if (c.glyph && !OVERWRITE) {
      kept++;
      console.log(`  ·  ${label} already "${c.glyph}" — left alone`);
      continue;
    }

    console.log(
      `  ✓  ${label} ${c.glyph ? `"${c.glyph}" → ` : ''}"${wanted}"`,
    );
    set++;

    if (APPLY) {
      await prisma.experienceCategory.update({
        where: { id: c.id },
        data: { glyph: wanted },
      });
    }
  }

  console.log(
    `\n  ${set} to set, ${kept} left alone, ${unmatched} unmatched.` +
      (unmatched > 0
        ? '\n  Unmatched categories render the neutral mark until somebody picks one.'
        : ''),
  );
  console.log('');
})()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
