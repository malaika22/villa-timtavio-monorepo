-- Recommended dining sitting times per meal, configured by the estate and shown
-- to guests as selectable chips: { "BREAKFAST": ["08:00", ...], "LUNCH": [...], "DINNER": [...] }
ALTER TABLE "EstateSettings" ADD COLUMN "sittingTimes" JSONB;

-- Late-arrival flags from secondary guests against the primary's sitting:
-- [{ "email", "name", "note"?, "allergies"?, "at" }]
ALTER TABLE "DiningRequest" ADD COLUMN "lateArrivals" JSONB;
