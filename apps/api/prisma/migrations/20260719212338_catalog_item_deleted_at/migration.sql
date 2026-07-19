-- AlterTable: soft-delete marker for catalog items (distinct from isActive)
ALTER TABLE "CatalogItem" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CatalogItem_deletedAt_idx" ON "CatalogItem"("deletedAt");
