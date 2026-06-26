-- CreateEnum
CREATE TYPE "DiningRequestKind" AS ENUM ('SITTING', 'ORDER');

-- CreateEnum
CREATE TYPE "DiningRequestStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "DiningRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "kind" "DiningRequestKind" NOT NULL,
    "status" "DiningRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "mealType" "MenuCategory",
    "date" TIMESTAMP(3),
    "time" TEXT,
    "partySize" INTEGER,
    "allergies" TEXT,
    "specialRequests" TEXT,
    "items" JSONB,
    "requestedFor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiningRequest_bookingId_idx" ON "DiningRequest"("bookingId");

-- CreateIndex
CREATE INDEX "DiningRequest_status_idx" ON "DiningRequest"("status");

-- AddForeignKey
ALTER TABLE "DiningRequest" ADD CONSTRAINT "DiningRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
