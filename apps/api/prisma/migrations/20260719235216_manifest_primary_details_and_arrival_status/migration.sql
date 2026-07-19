-- CreateEnum
CREATE TYPE "GuestArrivalStatus" AS ENUM ('EXPECTED', 'IN_VILLA', 'DEPARTED');

-- AlterTable: per-guest presence (REQ-5)
ALTER TABLE "ManifestGuest" ADD COLUMN "arrivalStatus" "GuestArrivalStatus" NOT NULL DEFAULT 'EXPECTED';

-- AlterTable: primary member's own per-stay manifest details (REQUIREMENT-model).
-- Room + presence are per-stay; dietary/allergies/beverage stay on the primary's
-- Guest record so the chef's brief, guest DNA and CRM keep reading a single source.
ALTER TABLE "Booking" ADD COLUMN "primaryRoomNumber" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "primaryArrivalStatus" "GuestArrivalStatus" NOT NULL DEFAULT 'EXPECTED';
