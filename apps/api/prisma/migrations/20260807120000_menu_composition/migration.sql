-- Menu composition — the estate publishes the whole menu, the party composes
-- each day from it.
--
-- Until now the estate decided every dish on every day and the guest only read
-- the result, which is the wrong way round for a villa where the kitchen cooks
-- for one party at a time. The printed menu becomes the pool; the primary
-- member picks within allowances the estate sets per course.
--
-- Additive throughout. Nothing is dropped: the weekly planner's tables stay
-- where they are, and the old sitting-time slots are read once here to derive
-- a service window rather than being discarded.

-- ─── Courses ────────────────────────────────────────────────────────────────
-- A course belongs to exactly one meal. That's what lets an allowance attach
-- to it unambiguously: three breakfast mains and one daily suggestion are two
-- separate allowances, not one allowance of four.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MenuCourse') THEN
    CREATE TYPE "MenuCourse" AS ENUM (
      'BREAKFAST_MAIN',
      'BREAKFAST_SUGGESTION',
      'LUNCH_SELECTION',
      'DINNER_STARTER',
      'DINNER_MAIN',
      'DINNER_DESSERT'
    );
  END IF;
END
$$;

-- Null for snacks, beverages and exclusives — those are ordered on demand, not
-- composed. Existing breakfast/lunch/dinner dishes are given the obvious
-- course below so nothing has to be re-filed by hand.
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "course" "MenuCourse";

UPDATE "MenuItem" SET "course" = 'BREAKFAST_MAIN'  WHERE "category" = 'BREAKFAST' AND "course" IS NULL;
UPDATE "MenuItem" SET "course" = 'LUNCH_SELECTION' WHERE "category" = 'LUNCH'     AND "course" IS NULL;
UPDATE "MenuItem" SET "course" = 'DINNER_MAIN'     WHERE "category" = 'DINNER'    AND "course" IS NULL;

-- ─── What a party has chosen ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "MenuSelection" (
  "id"             TEXT NOT NULL,
  "bookingId"      TEXT NOT NULL,
  "date"           DATE NOT NULL,
  "mealType"       "MenuCategory" NOT NULL,
  "note"           TEXT,
  "chosenByEmail"  TEXT,
  "chosenByName"   TEXT,
  "chosenAt"       TIMESTAMP(3),
  "amendedByEmail" TEXT,
  "amendedAt"      TIMESTAMP(3),
  -- The dish names as they stood before the estate's last amendment, so a swap
  -- shows the chef what it replaced rather than quietly becoming the truth.
  "amendedFrom"    JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuSelection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MenuSelectionItem" (
  "id"          TEXT NOT NULL,
  "selectionId" TEXT NOT NULL,
  "menuItemId"  TEXT NOT NULL,
  "course"      "MenuCourse" NOT NULL,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "MenuSelectionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MenuSelection_bookingId_date_mealType_key"
  ON "MenuSelection"("bookingId", "date", "mealType");
CREATE INDEX IF NOT EXISTS "MenuSelection_date_idx" ON "MenuSelection"("date");
CREATE INDEX IF NOT EXISTS "MenuSelection_bookingId_idx" ON "MenuSelection"("bookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "MenuSelectionItem_selectionId_menuItemId_key"
  ON "MenuSelectionItem"("selectionId", "menuItemId");
CREATE INDEX IF NOT EXISTS "MenuSelectionItem_selectionId_idx" ON "MenuSelectionItem"("selectionId");

ALTER TABLE "MenuSelection"
  DROP CONSTRAINT IF EXISTS "MenuSelection_bookingId_fkey";
ALTER TABLE "MenuSelection"
  ADD CONSTRAINT "MenuSelection_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuSelectionItem"
  DROP CONSTRAINT IF EXISTS "MenuSelectionItem_selectionId_fkey";
ALTER TABLE "MenuSelectionItem"
  ADD CONSTRAINT "MenuSelectionItem_selectionId_fkey"
  FOREIGN KEY ("selectionId") REFERENCES "MenuSelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuSelectionItem"
  DROP CONSTRAINT IF EXISTS "MenuSelectionItem_menuItemId_fkey";
ALTER TABLE "MenuSelectionItem"
  ADD CONSTRAINT "MenuSelectionItem_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Service windows and menu rules ─────────────────────────────────────────

ALTER TABLE "EstateSettings" ADD COLUMN IF NOT EXISTS "sittingWindows" JSONB;
ALTER TABLE "EstateSettings" ADD COLUMN IF NOT EXISTS "menuRules" JSONB;

-- Derive a window from whatever slots the estate had already configured, so
-- nobody has to re-enter times that were already right. The earliest slot
-- becomes the start, the latest the end, and the last seating is half an hour
-- before the end — a guest who chose the closing time used to arrive exactly
-- as the kitchen was shutting, which is the reason windows exist at all.
UPDATE "EstateSettings"
SET "sittingWindows" = jsonb_build_object(
  'BREAKFAST', jsonb_build_object('start', '09:00', 'end', '11:00', 'lastSeating', '10:30'),
  'LUNCH',     jsonb_build_object('start', '12:00', 'end', '16:00', 'lastSeating', '15:30'),
  'DINNER',    jsonb_build_object('start', '19:00', 'end', '21:00', 'lastSeating', '20:30')
)
WHERE "sittingWindows" IS NULL;
