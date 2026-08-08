-- Unwinding a booking with the vendor — the mirror of making it.
--
-- Booking gained two steps (ask on WhatsApp, record the answer) and cancelling
-- had neither: the estate pressed "confirm cancellation" and typed a fee, with
-- nothing recording that the vendor was ever told, what they said, or where
-- that number came from. So a guest could hear "cancelled" while the boat still
-- expected them, and the fee on their folio had no provenance.
--
-- Additive. Every existing row is null throughout, which reads as "the vendor
-- step hasn't happened" — true of everything cancelled before this shipped.

ALTER TABLE "ExperienceRequest"
  ADD COLUMN IF NOT EXISTS "vendorToldOfCancellationAt"  TIMESTAMP(3);
ALTER TABLE "ExperienceRequest"
  ADD COLUMN IF NOT EXISTS "vendorCancellationRepliedAt" TIMESTAMP(3);
ALTER TABLE "ExperienceRequest"
  ADD COLUMN IF NOT EXISTS "vendorCancellationNote"      TEXT;
