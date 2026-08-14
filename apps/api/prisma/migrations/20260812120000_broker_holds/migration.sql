-- Broker holds: a self-expiring claim on a date range, placed from the broker
-- availability page and resolved by the estate manager.
--
-- Additive throughout. Nothing existing is altered beyond one nullable column
-- on EstateSettings, so this is safe to apply while the API is serving.

-- The lifecycle of a hold. RELEASED is the estate saying no; EXPIRED is the
-- clock saying no. They are kept apart because the first is worth a phone call
-- and the second isn't.
CREATE TYPE "BrokerHoldStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED');

CREATE TABLE "BrokerHold" (
    "id" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "estimatedTotal" DECIMAL(10,2),
    "estimateSource" TEXT,
    "status" "BrokerHoldStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "note" TEXT,

    CONSTRAINT "BrokerHold_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BrokerHold_status_idx" ON "BrokerHold"("status");
CREATE INDEX "BrokerHold_checkIn_idx" ON "BrokerHold"("checkIn");

-- Every availability read filters on this, and the sweeper sorts by it.
CREATE INDEX "BrokerHold_expiresAt_idx" ON "BrokerHold"("expiresAt");

-- Indicative nightly rates by season, used only where Lodgify has no rate for
-- a night. Nullable: an estate with Lodgify rates loaded never needs it.
ALTER TABLE "EstateSettings" ADD COLUMN "seasonRates" JSONB;
