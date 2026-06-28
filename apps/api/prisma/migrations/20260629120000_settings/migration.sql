-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ESTATE_MANAGER', 'READ_ONLY');

-- CreateTable
CREATE TABLE "StaffAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'ESTATE_MANAGER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "villaBaseRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.16,
    "serviceChargeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.16,
    "notifyNewInquiry" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewRequest" BOOLEAN NOT NULL DEFAULT true,
    "notifyTaskOverdue" BOOLEAN NOT NULL DEFAULT true,
    "notifyInventoryLow" BOOLEAN NOT NULL DEFAULT true,
    "notifyLodgifyError" BOOLEAN NOT NULL DEFAULT true,
    "notifyStripeError" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstateSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAccount_email_key" ON "StaffAccount"("email");
