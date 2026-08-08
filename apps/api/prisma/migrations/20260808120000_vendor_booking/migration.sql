-- Booking the vendor — the step the system couldn't see.
--
-- Every vendor is booked by WhatsApp, by hand. That works; what didn't was that
-- nothing recorded whether it had happened, so a guest could be told
-- "confirmed" for an experience nobody had been asked about, and a request
-- waiting on a vendor looked identical to one nobody had opened.
--
-- Timestamps rather than new RequestStatus values. A request waiting on a
-- vendor is still pending — it's pending on something specific — and the enum
-- feeds every queue, filter and chip across three apps. Same shape as the
-- cancellation sub-state already uses.
--
-- Additive. Every existing request has nulls throughout, which reads as "no
-- vendor step has happened", and the gate below only applies to items that
-- actually have a vendor.

ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorAskedAt"      TIMESTAMP(3);
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorAskedBy"      TEXT;
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorRepliedAt"    TIMESTAMP(3);
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorConfirmedAt"  TIMESTAMP(3);
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorDeclinedAt"   TIMESTAMP(3);
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorQuotedCost"   DECIMAL(10,2);
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorNote"         TEXT;
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorProposedDate" TIMESTAMP(3);
ALTER TABLE "ExperienceRequest" ADD COLUMN IF NOT EXISTS "vendorProposedTime" TEXT;

-- Anything already confirmed was booked with the vendor by hand before this
-- existed. Backfilling it as confirmed keeps those requests out of a queue
-- that would otherwise tell Rodrigo to go and ask about a boat that sailed.
UPDATE "ExperienceRequest"
SET "vendorConfirmedAt" = COALESCE("statusUpdatedAt", "updatedAt"),
    "vendorRepliedAt"   = COALESCE("statusUpdatedAt", "updatedAt")
WHERE "vendorConfirmedAt" IS NULL
  AND "status" IN ('CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED');

-- Whether the estate's own staff prepare anything for this experience. A
-- therapist who brings her own table needs nothing from the villa, and a task
-- nobody actions is a task everybody learns to ignore. Defaults true, so
-- nothing changes for anything that exists today.
ALTER TABLE "CatalogItem" ADD COLUMN IF NOT EXISTS "needsSetupTask" BOOLEAN NOT NULL DEFAULT true;
