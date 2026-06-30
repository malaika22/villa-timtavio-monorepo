-- CreateTable
CREATE TABLE "HealthSample" (
    "id" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ok" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "HealthSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthSample_checkedAt_idx" ON "HealthSample"("checkedAt");
