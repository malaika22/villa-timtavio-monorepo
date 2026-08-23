-- Who placed a broker hold, and for how many people.
--
-- A hold arrived with a typed name and nothing else, so the estate could
-- neither reach the broker nor enter the reservation in Lodgify without asking
-- them. All three are required by the API on new holds.
--
-- Nullable on purpose. Holds placed before this existed genuinely have no email
-- and no party size; a NOT NULL with a backfilled default would invent an
-- address nobody can write to and a headcount nobody chose. The dashboard shows
-- them as "not recorded", which is the truth.
ALTER TABLE "BrokerHold" ADD COLUMN "brokerEmail" TEXT;
ALTER TABLE "BrokerHold" ADD COLUMN "brokerAgency" TEXT;
ALTER TABLE "BrokerHold" ADD COLUMN "guestCount" INTEGER;
