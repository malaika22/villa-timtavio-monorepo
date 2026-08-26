-- Which line drawing stands in for an experience with no photograph yet.
--
-- Nullable on purpose: the eight categories that already exist keep working
-- untouched, and a category added later and left alone renders a neutral mark
-- rather than nothing at all. scripts/seed-category-glyphs.js fills in the
-- ones that exist today.
ALTER TABLE "ExperienceCategory" ADD COLUMN "glyph" TEXT;
