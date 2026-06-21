-- CreateTable
CREATE TABLE "MagicToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "guestTier" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MagicToken_email_idx" ON "MagicToken"("email");

-- CreateIndex
CREATE INDEX "MagicToken_otp_email_idx" ON "MagicToken"("otp", "email");
