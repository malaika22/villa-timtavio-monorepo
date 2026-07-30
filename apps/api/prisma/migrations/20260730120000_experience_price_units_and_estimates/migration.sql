-- Experience pricing: unit-aware estimates, and hard quotes that need a second
-- primary approval when they land materially above the approved estimate.

-- What a price unit multiplies its rate by. Adding a unit is a PriceUnit row,
-- but a unit needing a quantity we don't capture yet needs a source here first.
CREATE TYPE "PriceMultiplierSource" AS ENUM ('NONE', 'GUEST_COUNT', 'NIGHTS');

CREATE TABLE "PriceUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "multiplierSource" "PriceMultiplierSource" NOT NULL DEFAULT 'NONE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceUnit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PriceUnit_code_key" ON "PriceUnit"("code");
CREATE INDEX "PriceUnit_isActive_idx" ON "PriceUnit"("isActive");
CREATE INDEX "PriceUnit_sortOrder_idx" ON "PriceUnit"("sortOrder");

-- Catalog: optional range high-end (basePrice becomes the low end) + the unit.
ALTER TABLE "CatalogItem" ADD COLUMN "priceMax" DECIMAL(10,2);
ALTER TABLE "CatalogItem" ADD COLUMN "priceUnitId" TEXT;

ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_priceUnitId_fkey"
    FOREIGN KEY ("priceUnitId") REFERENCES "PriceUnit"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Request: the estimate snapshot, plus the parked quote awaiting re-approval.
ALTER TABLE "ExperienceRequest" ADD COLUMN "estimatedMin" DECIMAL(10,2);
ALTER TABLE "ExperienceRequest" ADD COLUMN "estimatedMax" DECIMAL(10,2);
ALTER TABLE "ExperienceRequest" ADD COLUMN "priceUnitCode" TEXT;
ALTER TABLE "ExperienceRequest" ADD COLUMN "quotedCost" DECIMAL(10,2);
ALTER TABLE "ExperienceRequest" ADD COLUMN "quoteApprovalRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExperienceRequest" ADD COLUMN "quoteApprovedAt" TIMESTAMP(3);
ALTER TABLE "ExperienceRequest" ADD COLUMN "quoteApprovedBy" TEXT;

-- Seed the three units the estate uses today. Per-night is deliberately left
-- out: it works the moment a row is added, so it needs no code change.
INSERT INTO "PriceUnit" ("id", "code", "label", "shortLabel", "multiplierSource", "sortOrder", "updatedAt")
VALUES
    ('pu_per_person', 'PER_PERSON', 'Per person', '/ person', 'GUEST_COUNT', 10, CURRENT_TIMESTAMP),
    ('pu_per_group',  'PER_GROUP',  'Per group',  '/ group',  'NONE',        20, CURRENT_TIMESTAMP),
    ('pu_per_event',  'PER_EVENT',  'Per event',  '/ event',  'NONE',        30, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Existing priced experiences default to per-person, the estate's most common
-- arrangement. Free (included) items stay unpriced and unassigned.
UPDATE "CatalogItem"
SET "priceUnitId" = 'pu_per_person'
WHERE "priceUnitId" IS NULL
  AND "isIncluded" = false
  AND "basePrice" IS NOT NULL;
