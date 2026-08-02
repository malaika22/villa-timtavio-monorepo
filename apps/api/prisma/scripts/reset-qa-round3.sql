-- ─────────────────────────────────────────────────────────────────────────────
-- QA ROUND 3 RESET — clear test data before the pre-arrival / install QA pass
--
-- CLEARS EVERYTHING TRANSACTIONAL:
--   Guest, Booking, ManifestGuest, ManifestDraft, ExperienceRequest,
--   DiningRequest, FolioItem, Notification, CrmNote, MagicToken, VendorRating,
--   SatisfactionReview, PushSubscription, ScheduleItem, AuditLog
--
-- CLEARS ONLY THE NAMED INQUIRIES (every other row survives):
--   bilidij626@copawoke.com
--   vewoma3922@copawoke.com
--   wegij45194@davopa.com
--   todago8151@copawoke.com
--
-- KEEPS: CatalogItem, ExperienceCategory, PriceUnit, MenuItem, Recommendation,
--   Vendor, Room, EstateSettings, StaffAccount, InventoryItem, StockMovement,
--   Equipment, ServiceEvent, SystemAlert, HealthSample — the configuration the
--   QA pass needs in place, and any inquiry not listed above.
--
-- ⚠ DELETING EVERY GUEST ALSO DELETES EVERY BOOKING — Booking.primaryGuestId is
--   a real foreign key, so the CASCADE reaches bookings whether or not they were
--   removed in Lodgify first. Nothing can be tested until a fresh Lodgify
--   booking syncs through. Round 3 needs check-in AT LEAST THREE WEEKS OUT —
--   the whole point of this pass is the lead time.
--
-- ⚠ MagicToken is truncated, so every outstanding access link and six-digit code
--   dies with it. Anyone mid-session on the PWA will be signed out. Request a
--   new link after this runs.
--
-- Inquiry is NOT truncated: convertedToBookingId is a plain column, not a
-- foreign key, so the CASCADE cannot reach it. A row pointing at a deleted
-- booking keeps a stale id, which is harmless — and the four listed above are
-- deleted outright anyway.
--
-- Run on the Render shell:
--   cd /app/apps/api && npx prisma db execute \
--     --file prisma/scripts/reset-qa-round3.sql --schema prisma/schema.prisma
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

TRUNCATE TABLE
  "Guest",
  "Booking",
  "ManifestGuest",
  "ManifestDraft",
  "ExperienceRequest",
  "DiningRequest",
  "FolioItem",
  "Notification",
  "CrmNote",
  "MagicToken",
  "VendorRating",
  "SatisfactionReview",
  "PushSubscription",
  "ScheduleItem",
  "AuditLog"
RESTART IDENTITY CASCADE;

DELETE FROM "Inquiry"
WHERE email IN (
  'bilidij626@copawoke.com',
  'vewoma3922@copawoke.com',
  'wegij45194@davopa.com',
  'todago8151@copawoke.com'
);

COMMIT;
