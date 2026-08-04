-- Menus that belong to a day.
--
-- MenuItem had no notion of "today": every active dish was shown to every guest
-- on every day of their stay, including ones the kitchen stopped making months
-- ago. DailyMenu records what is actually being cooked for one meal on one day,
-- drawn from the dish library, and stays invisible until published.
--
-- Additive and non-destructive. Every existing dish becomes part of the library
-- (isStanding defaults true), so nothing a guest can see changes until the
-- estate publishes its first service.

-- Standing dishes are the curated library; a one-off is created while planning
-- a single service and never joins it.
ALTER TABLE "MenuItem" ADD COLUMN "isStanding" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DailyMenu" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MenuCategory" NOT NULL,
    "note" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "DailyMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMenuItem" (
    "id" TEXT NOT NULL,
    "dailyMenuId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyMenu_date_idx" ON "DailyMenu"("date");

-- One service per meal per day — planning Thursday dinner twice is a mistake,
-- not a feature.
CREATE UNIQUE INDEX "DailyMenu_date_mealType_key" ON "DailyMenu"("date", "mealType");

-- CreateIndex
CREATE INDEX "DailyMenuItem_dailyMenuId_idx" ON "DailyMenuItem"("dailyMenuId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMenuItem_dailyMenuId_menuItemId_key" ON "DailyMenuItem"("dailyMenuId", "menuItemId");

-- AddForeignKey
ALTER TABLE "DailyMenuItem" ADD CONSTRAINT "DailyMenuItem_dailyMenuId_fkey" FOREIGN KEY ("dailyMenuId") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMenuItem" ADD CONSTRAINT "DailyMenuItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
