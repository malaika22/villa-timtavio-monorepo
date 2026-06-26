-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "hostAvatarUrl" TEXT,
ADD COLUMN     "hostName" TEXT,
ADD COLUMN     "hostReviewNote" TEXT,
ADD COLUMN     "hostTitle" TEXT,
ADD COLUMN     "included" TEXT[] DEFAULT ARRAY[]::TEXT[];
