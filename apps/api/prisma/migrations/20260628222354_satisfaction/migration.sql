-- CreateTable
CREATE TABLE "SatisfactionReview" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "overall" INTEGER NOT NULL,
    "cleanliness" INTEGER NOT NULL,
    "staff" INTEGER NOT NULL,
    "experiences" INTEGER NOT NULL,
    "privacy" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "arrival" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatisfactionReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SatisfactionReview_createdAt_idx" ON "SatisfactionReview"("createdAt");
