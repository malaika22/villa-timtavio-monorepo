/*
  Warnings:

  - You are about to drop the column `rimaryApprovedBy` on the `ExperienceRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExperienceRequest" DROP COLUMN "rimaryApprovedBy",
ADD COLUMN     "primaryApprovedBy" TEXT;
