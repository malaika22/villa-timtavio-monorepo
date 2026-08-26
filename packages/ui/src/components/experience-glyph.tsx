import * as React from 'react';

/**
 * The marks a category can wear.
 *
 * Line drawings rather than filled icons: they sit at 40px on a warm tint
 * behind a caption, and anything heavier competes with the photographs on the
 * cards beside them.
 *
 * The set is deliberately small. A picker of forty marks is a picker nobody
 * finishes reading, and every one of these answers something the estate
 * actually sells — boats, water, agave, the cellar, the temazcal, the pantry,
 * Oaxaca itself, the drive in, the hills, and privacy.
 */
export const EXPERIENCE_GLYPHS = [
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
] as const;

export type ExperienceGlyph = (typeof EXPERIENCE_GLYPHS)[number];

/** Shown in the picker, and nowhere a guest can read it. */
export const EXPERIENCE_GLYPH_LABELS: Record<ExperienceGlyph, string> = {
  waves: 'Waves',
  boat: 'Boat',
  agave: 'Agave',
  wine: 'Cellar',
  steam: 'Steam',
  provisions: 'Provisions',
  temple: 'Temple',
  path: 'Road',
  peak: 'Hills',
  key: 'Key',
  mark: 'Plain mark',
};

export const isExperienceGlyph = (v: unknown): v is ExperienceGlyph =>
  typeof v === 'string' && (EXPERIENCE_GLYPHS as readonly string[]).includes(v);

const PATHS: Record<ExperienceGlyph, React.ReactNode> = {
  waves: (
    <>
      <path d="M4 18c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
      <path d="M4 27c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
      <path d="M4 36c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
    </>
  ),
  boat: (
    <>
      <path d="M24 8v20" />
      <path d="M24 12l12 14H24" />
      <path d="M22 26H12l10-11z" />
      <path d="M7 32h34l-5 8H12z" />
    </>
  ),
  agave: (
    <>
      <path d="M24 42v-9" />
      <path d="M24 33c-3-8-9-13-15-15 2 8 7 14 15 15Z" />
      <path d="M24 33c3-8 9-13 15-15-2 8-7 14-15 15Z" />
      <path d="M24 33c-2-10-1-19 0-27 1 8 2 17 0 27Z" />
      <path d="M24 33c-5-6-8-13-9-20 4 6 8 12 9 20Z" />
      <path d="M24 33c5-6 8-13 9-20-4 6-8 12-9 20Z" />
    </>
  ),
  wine: (
    <>
      <path d="M17 8h14l-1 10a6 6 0 0 1-12 0z" />
      <path d="M24 24v13" />
      <path d="M16 40h16" />
    </>
  ),
  steam: (
    <>
      <path d="M16 33c0-5 3-6 3-10s-3-5-3-9" />
      <path d="M24 33c0-6 3.5-7 3.5-11.5S24 15 24 10" />
      <path d="M32 33c0-5 3-6 3-10s-3-5-3-9" />
      <path d="M9 39h30" />
    </>
  ),
  provisions: (
    <>
      <path d="M8 18h32l-3 21a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2z" />
      <path d="M17 18V12a7 7 0 0 1 14 0v6" />
      <path d="M20 26v8M28 26v8" />
    </>
  ),
  temple: (
    <>
      <path d="M6 40h36" />
      <path d="M10 40V22M18 40V22M30 40V22M38 40V22" />
      <path d="M7 22h34" />
      <path d="M24 8l15 14H9z" />
    </>
  ),
  path: (
    <>
      <path d="M9 42c4-14 8-22 8-34" />
      <path d="M39 42c-4-14-8-22-8-34" />
      <path d="M24 36v-6M24 24v-6M24 12V8" />
    </>
  ),
  peak: (
    <>
      <circle cx="35" cy="14" r="4" />
      <path d="M4 36l12-14 8 9" />
      <path d="M17 36l10-11 17 11" />
    </>
  ),
  key: (
    <>
      <circle cx="18" cy="20" r="8" />
      <path d="M24 26l14 14" />
      <path d="M34 36l4-4M30 32l4-4" />
    </>
  ),
  mark: (
    <>
      <path d="M24 8l7 16-7 16-7-16z" />
      <path d="M8 24h8M32 24h8" />
    </>
  ),
};

/**
 * A category's mark, drawn.
 *
 * Falls back to the plain one rather than rendering nothing: a category the
 * estate hasn't chosen a glyph for should still look like a decision, and an
 * empty tile is the thing this whole placeholder exists to avoid.
 */
export function ExperienceGlyphMark({
  glyph,
  className,
  strokeWidth = 1.4,
}: {
  glyph?: string | null;
  className?: string;
  strokeWidth?: number;
}) {
  const key: ExperienceGlyph = isExperienceGlyph(glyph) ? glyph : 'mark';

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[key]}
    </svg>
  );
}
