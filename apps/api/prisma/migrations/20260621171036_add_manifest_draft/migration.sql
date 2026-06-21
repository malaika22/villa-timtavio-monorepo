-- CreateTable
CREATE TABLE "ManifestDraft" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "guestId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManifestDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManifestDraft_bookingId_key" ON "ManifestDraft"("bookingId");

-- CreateIndex
CREATE INDEX "ManifestDraft_bookingId_idx" ON "ManifestDraft"("bookingId");

-- AddForeignKey
ALTER TABLE "ManifestDraft" ADD CONSTRAINT "ManifestDraft_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
