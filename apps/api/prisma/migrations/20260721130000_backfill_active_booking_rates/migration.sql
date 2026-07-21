-- Backfill tax/service rates onto ACTIVE (not-yet-departed) bookings from the
-- estate's configured pricing (EstateSettings singleton). This makes the
-- Settings → Pricing values apply to current/upcoming stays. Checked-out and
-- cancelled stays are left untouched — they keep whatever they were quoted.
UPDATE "Booking"
SET
  "taxRate" = COALESCE((SELECT "taxRate" FROM "EstateSettings" WHERE "id" = 'singleton'), 0.16),
  "serviceChargeRate" = COALESCE((SELECT "serviceChargeRate" FROM "EstateSettings" WHERE "id" = 'singleton'), 0.16)
WHERE "status" NOT IN ('CHECKED_OUT', 'CANCELLED');
