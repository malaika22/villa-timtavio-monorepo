-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'APPROVED', 'DECLINED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "PurposeOfStay" AS ENUM ('CORPORATE_RETREAT', 'FAMILY', 'WEDDING', 'CONTENT_PRODUCTION', 'OTHER');

-- AlterTable
ALTER TABLE "ExperienceRequest" ADD COLUMN     "primaryApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primaryApprovedAt" TIMESTAMP(3),
ADD COLUMN     "requiresPrimaryApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rimaryApprovedBy" TEXT;

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "preferredFrom" TIMESTAMP(3),
    "preferredTo" TIMESTAMP(3),
    "guestCount" INTEGER,
    "purposeOfStay" "PurposeOfStay",
    "socialHandle" TEXT,
    "source" TEXT,
    "message" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "convertedToBookingId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_email_idx" ON "Inquiry"("email");
