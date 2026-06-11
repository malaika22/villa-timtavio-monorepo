-- CreateEnum
CREATE TYPE "ScheduleItemType" AS ENUM ('TRANSPORT', 'SECURITY', 'HOUSEKEEPING', 'MAINTENANCE', 'STAFF_BRIEFING', 'OTHER');

-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'CONFLICT';

-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "guestName" TEXT,
    "bookingId" TEXT,
    "type" "ScheduleItemType" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleItem_time_idx" ON "ScheduleItem"("time");
