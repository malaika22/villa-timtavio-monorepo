-- Records when the estate last read a booking's guest brief.
--
-- Replaces the manifest approval step. Approval gated nothing — secondary
-- guests already receive access the moment they are added — but it did carry
-- one useful fact: the point at which the estate had read the list. That is
-- what tells Rodrigo an allergy was added after he forwarded the brief to the
-- chef, which is the only real risk in letting the manifest stay editable.
--
-- Additive and nullable: existing bookings simply read as never viewed.

ALTER TABLE "Booking" ADD COLUMN "manifestBriefViewedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "manifestBriefViewedBy" TEXT;
