-- Guests planning weeks ahead change their minds. A request the estate hasn't
-- confirmed can simply be withdrawn, but once it is confirmed a vendor is
-- booked — so the guest asks, and Rodrigo unwinds it. These columns hold that
-- middle state, and whatever the vendor charged for the privilege.

ALTER TABLE "ExperienceRequest" ADD COLUMN "cancellationRequestedAt" TIMESTAMP(3);
ALTER TABLE "ExperienceRequest" ADD COLUMN "cancellationRequestedBy" TEXT;
ALTER TABLE "ExperienceRequest" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "ExperienceRequest" ADD COLUMN "cancellationFee" DECIMAL(10,2);
