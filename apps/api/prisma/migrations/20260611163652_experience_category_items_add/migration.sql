-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "experienceCategoryId" TEXT;

-- CreateTable
CREATE TABLE "ExperienceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceCategory_slug_key" ON "ExperienceCategory"("slug");

-- CreateIndex
CREATE INDEX "ExperienceCategory_isActive_idx" ON "ExperienceCategory"("isActive");

-- CreateIndex
CREATE INDEX "ExperienceCategory_sortOrder_idx" ON "ExperienceCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "CatalogItem_experienceCategoryId_idx" ON "CatalogItem"("experienceCategoryId");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_experienceCategoryId_fkey" FOREIGN KEY ("experienceCategoryId") REFERENCES "ExperienceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
