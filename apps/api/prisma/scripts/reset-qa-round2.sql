-- ─────────────────────────────────────────────────────────────────────────────
-- QA ROUND 2 RESET — clear test data before the Estate Manager QA pass
--
-- CLEARS EVERYTHING TRANSACTIONAL:
--   Guest, Booking, ManifestGuest, ManifestDraft, ExperienceRequest,
--   DiningRequest, FolioItem, Notification, CrmNote, MagicToken, VendorRating,
--   SatisfactionReview, PushSubscription, ScheduleItem, AuditLog
--
-- CLEARS ONLY THE NAMED INQUIRIES (the other rows survive):
--   gefeyol726@kierko.com
--   malaikaafridi22@gmail.com            (both rows)
--   salazartrujillorodrigo@gmail.com
--
-- KEEPS: CatalogItem, ExperienceCategory, PriceUnit, MenuItem, Recommendation,
--   Vendor, Room, EstateSettings, StaffAccount, InventoryItem, StockMovement,
--   Equipment, ServiceEvent, SystemAlert, HealthSample — and any inquiry not
--   listed above (currently Jason Bornstein and Alejandro García Menéndez).
--
-- ⚠ DELETING EVERY GUEST ALSO DELETES EVERY BOOKING — Booking.primaryGuestId is
--   a real foreign key. That includes the upcoming Roo Saa stay (Sep 1–5). A
--   fresh Lodgify booking is needed before the experience flow can be tested.
--
-- Inquiry is NOT truncated: convertedToBookingId is a plain column, not an FK,
-- so the CASCADE below cannot reach it. Rows that pointed at a deleted booking
-- keep a stale id, which is harmless — and all three converted/approved
-- inquiries are in the delete list anyway.
--
-- Run on the Render shell:
--   cd /app/apps/api && npx prisma db execute \
--     --file prisma/scripts/reset-qa-round2.sql --schema prisma/schema.prisma
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
  'gefeyol726@kierko.com',
  'malaikaafridi22@gmail.com',
  'salazartrujillorodrigo@gmail.com'
);

COMMIT;
