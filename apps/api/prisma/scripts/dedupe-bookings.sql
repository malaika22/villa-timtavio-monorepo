-- ─────────────────────────────────────────────────────────────────────────────
-- DEDUPE BOOKINGS — remove duplicate reservations for the same guest + dates
--
-- Four Lodgify reservations synced for the same guest and the same check-in,
-- and the EM's "Current Booking" picker landed on an empty one while the guest
-- had submitted their manifest against another.
--
-- For each (primaryGuestId, checkIn) group this KEEPS one booking — the one
-- with the most manifest guests, then the most experience requests, then the
-- most recently created — and deletes the rest along with everything hanging
-- off them.
--
-- Bookings that are already CHECKED_OUT or CANCELLED are left alone: they are
-- history, not duplicates competing to be "current".
--
-- ⚠ Deletes rows permanently. Cancel the surplus reservations in LODGIFY too,
--   or the 5-minute poll will simply recreate them on its next run.
--
-- Run on the Render shell:
--   cd /app/apps/api && npx prisma db execute \
--     --file prisma/scripts/dedupe-bookings.sql --schema prisma/schema.prisma
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE TEMP TABLE bookings_to_drop AS
SELECT id FROM (
  SELECT
    b.id,
    ROW_NUMBER() OVER (
      PARTITION BY b."primaryGuestId", b."checkIn"
      ORDER BY
        (SELECT COUNT(*) FROM "ManifestGuest" mg WHERE mg."bookingId" = b.id) DESC,
        (SELECT COUNT(*) FROM "ExperienceRequest" er WHERE er."bookingId" = b.id) DESC,
        b."createdAt" DESC
    ) AS rank
  FROM "Booking" b
  WHERE b.status NOT IN ('CHECKED_OUT', 'CANCELLED')
) ranked
WHERE rank > 1;

-- Children first — these all carry a bookingId.
DELETE FROM "ManifestGuest"       WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "ManifestDraft"       WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "ExperienceRequest"   WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "DiningRequest"       WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "FolioItem"           WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "Notification"        WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "MagicToken"          WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "ScheduleItem"        WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "SatisfactionReview"  WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);
DELETE FROM "AuditLog"            WHERE "bookingId" IN (SELECT id FROM bookings_to_drop);

-- Inquiries point at a booking by plain column, not an FK — clear the link so
-- a converted inquiry doesn't reference a booking that no longer exists.
UPDATE "Inquiry"
SET "convertedToBookingId" = NULL
WHERE "convertedToBookingId" IN (SELECT id FROM bookings_to_drop);

DELETE FROM "Booking" WHERE id IN (SELECT id FROM bookings_to_drop);

COMMIT;
