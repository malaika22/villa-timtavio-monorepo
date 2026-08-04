-- Exclusive additions — the first chargeable thing in dining.
--
-- Everything else on the dining page is included in the stay, which is why
-- these get their own menu category and their own folio line rather than being
-- filed among the incidentals: a $2,000 bottle beside the minibar reads oddly
-- on a bill someone is about to settle.
--
-- Additive throughout. No existing row changes meaning, and no guest sees
-- anything new until the estate adds its first exclusive item.

-- Postgres will not let a new enum value be USED in the same transaction that
-- adds it. Nothing below writes these values, so this is safe — but any
-- backfill of them would have to be a separate migration.
ALTER TYPE "MenuCategory" ADD VALUE IF NOT EXISTS 'EXCLUSIVE';
ALTER TYPE "FolioItemType" ADD VALUE IF NOT EXISTS 'DINING';

-- Priced items. Null for everything included, which is every existing row.
ALTER TABLE "MenuItem" ADD COLUMN "price" DECIMAL(10,2);

-- The order's own total, priced server-side at the moment it was placed, so a
-- later change to the cellar list can't rewrite what a guest agreed to.
ALTER TABLE "DiningRequest" ADD COLUMN "totalAmount" DECIMAL(10,2);

-- The sitting an exclusive should arrive at, when the guest attached it.
ALTER TABLE "DiningRequest" ADD COLUMN "linkedSittingId" TEXT;

-- Approval. Defaults true so every existing request — and all included dining
-- forever — is unaffected; only a secondary's chargeable order starts false.
ALTER TABLE "DiningRequest" ADD COLUMN "primaryApproved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DiningRequest" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "DiningRequest" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "DiningRequest" ADD COLUMN "declineReason" TEXT;

-- Set when confirmed and charged, so cancelling can take the charge back off.
ALTER TABLE "DiningRequest" ADD COLUMN "folioItemId" TEXT;
