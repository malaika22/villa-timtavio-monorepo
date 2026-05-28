-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ManifestStatus" AS ENUM ('INCOMPLETE', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "GuestRole" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('KING_MASTER_SUITE', 'LUXURY_BUNK_ROOM');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FolioItemType" AS ENUM ('ESTATE_BASE_RATE', 'EXPERIENCE', 'INCIDENTAL', 'PRE_STOCKED');

-- CreateEnum
CREATE TYPE "CatalogCategory" AS ENUM ('INCLUDED', 'ARRIVAL_TRANSIT', 'WELLNESS', 'CULINARY_AGAVE', 'OCEAN_ADVENTURE', 'EXCURSIONS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MenuCategory" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'BEVERAGES');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXPERIENCE_READY', 'REQUEST_CONFIRMED', 'CHARGE_ADDED', 'REQUEST_CANCELLED', 'MANIFEST_APPROVED', 'MAGIC_LINK_SENT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_STATUS_CHANGED', 'BOOKING_CHECKED_OUT', 'MANIFEST_GUEST_ADDED', 'MANIFEST_GUEST_UPDATED', 'MANIFEST_GUEST_REMOVED', 'MANIFEST_SUBMITTED', 'MANIFEST_APPROVED', 'MAGIC_LINK_SENT', 'MAGIC_LINK_RESENT', 'SESSION_REVOKED', 'CATALOG_ITEM_CREATED', 'CATALOG_ITEM_UPDATED', 'CATALOG_ITEM_DELETED', 'EXPERIENCE_REQUESTED', 'EXPERIENCE_CONFIRMED', 'EXPERIENCE_CANCELLED', 'EXPERIENCE_READY', 'EXPERIENCE_COMPLETED', 'FOLIO_CHARGE_ADDED', 'FOLIO_CHARGE_EDITED', 'CHECKOUT_TRIGGERED', 'PAYMENT_CAPTURED', 'PAYMENT_FAILED', 'VENDOR_CREATED', 'VENDOR_UPDATED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "lodgifyId" TEXT NOT NULL,
    "lodgifyRawData" JSONB,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "totalGuests" INTEGER NOT NULL DEFAULT 1,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "manifestStatus" "ManifestStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "baseRate" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.08,
    "serviceChargeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "stripeCustomerId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeDepositAmount" DECIMAL(10,2),
    "stripeDepositCaptured" BOOLEAN NOT NULL DEFAULT false,
    "stripeCheckoutAmount" DECIMAL(10,2),
    "stripeCapturedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "primaryGuestId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "auth0Id" TEXT,
    "role" "GuestRole" NOT NULL DEFAULT 'SECONDARY',
    "beveragePreferences" TEXT,
    "winePreferences" TEXT,
    "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergies" TEXT,
    "favouriteExperiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredTimes" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "specialOccasions" TEXT,
    "preferredRoomType" "RoomType",
    "pillarPreferences" TEXT,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "firstStayDate" TIMESTAMP(3),
    "lastStayDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmNote" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManifestGuest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "relationship" TEXT,
    "roomNumber" INTEGER,
    "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergies" TEXT,
    "beveragePreferences" TEXT,
    "specialNotes" TEXT,
    "auth0UserId" TEXT,
    "pwaLinkSent" BOOLEAN NOT NULL DEFAULT false,
    "pwaLinkSentAt" TIMESTAMP(3),
    "pwaLinkOpened" BOOLEAN NOT NULL DEFAULT false,
    "pwaLinkOpenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManifestGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RoomType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bedConfig" TEXT NOT NULL,
    "floorLevel" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CatalogCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "isIncluded" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "durationMinutes" INTEGER,
    "durationLabel" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryPhotoUrl" TEXT,
    "isMultiDay" BOOLEAN NOT NULL DEFAULT false,
    "multiDayDuration" INTEGER,
    "availableTimeSlots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxGuestCount" INTEGER,
    "setupLeadTimeMinutes" INTEGER,
    "vendorId" TEXT,
    "breezeWayTeamId" TEXT,
    "breezeWayTemplateId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MenuCategory" NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "containsNuts" BOOLEAN NOT NULL DEFAULT false,
    "containsDairy" BOOLEAN NOT NULL DEFAULT false,
    "containsShellfish" BOOLEAN NOT NULL DEFAULT false,
    "otherDietaryNotes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "externalUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CatalogCategory" NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "photoUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRating" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "experienceRequestId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "guestTier" "GuestRole" NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "specialRequests" TEXT,
    "returnDate" TIMESTAMP(3),
    "transportPreference" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedDate" TIMESTAMP(3),
    "confirmedTime" TEXT,
    "confirmedCost" DECIMAL(10,2),
    "emNotes" TEXT,
    "declineReason" TEXT,
    "breezeWayTaskId" TEXT,
    "breezeWayTaskCreatedAt" TIMESTAMP(3),
    "setupPhotoUrl" TEXT,
    "setupCompletedAt" TIMESTAMP(3),
    "staffMemberName" TEXT,
    "folioItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolioItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "FolioItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "attributedToEmail" TEXT,
    "attributedToName" TEXT,
    "staffNote" TEXT,
    "loggedBy" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editableUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deepLink" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "readAt" TIMESTAMP(3),
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" TIMESTAMP(3),
    "pushEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dhKey" TEXT NOT NULL,
    "authKey" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reorderThreshold" INTEGER NOT NULL,
    "maxStock" INTEGER,
    "isOnOrder" BOOLEAN NOT NULL DEFAULT false,
    "onOrderSince" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "bookingId" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceEvent" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "timeBlock" TEXT NOT NULL,
    "estateSpace" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "catalogCategory" TEXT,
    "hasCost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "rentalCostPerUse" DECIMAL(10,2),
    "rentalCostPerMonth" DECIMAL(10,2),
    "totalRentalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalUses" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" DECIMAL(10,2),
    "estimatedAnnualMaintenanceCost" DECIMAL(10,2),
    "breakEvenMonths" INTEGER,
    "recommendation" TEXT,
    "lastCalculatedAt" TIMESTAMP(3),
    "seasonalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "metadata" JSONB,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedBy" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_lodgifyId_key" ON "Booking"("lodgifyId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_checkIn_idx" ON "Booking"("checkIn");

-- CreateIndex
CREATE INDEX "Booking_checkOut_idx" ON "Booking"("checkOut");

-- CreateIndex
CREATE INDEX "Booking_lodgifyId_idx" ON "Booking"("lodgifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_email_key" ON "Guest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_auth0Id_key" ON "Guest"("auth0Id");

-- CreateIndex
CREATE INDEX "Guest_email_idx" ON "Guest"("email");

-- CreateIndex
CREATE INDEX "Guest_auth0Id_idx" ON "Guest"("auth0Id");

-- CreateIndex
CREATE INDEX "CrmNote_guestId_idx" ON "CrmNote"("guestId");

-- CreateIndex
CREATE INDEX "ManifestGuest_bookingId_idx" ON "ManifestGuest"("bookingId");

-- CreateIndex
CREATE INDEX "ManifestGuest_email_idx" ON "ManifestGuest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ManifestGuest_bookingId_email_key" ON "ManifestGuest"("bookingId", "email");

-- CreateIndex
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem"("category");

-- CreateIndex
CREATE INDEX "CatalogItem_isActive_idx" ON "CatalogItem"("isActive");

-- CreateIndex
CREATE INDEX "CatalogItem_isIncluded_idx" ON "CatalogItem"("isIncluded");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRating_experienceRequestId_key" ON "VendorRating"("experienceRequestId");

-- CreateIndex
CREATE INDEX "VendorRating_vendorId_idx" ON "VendorRating"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceRequest_breezeWayTaskId_key" ON "ExperienceRequest"("breezeWayTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceRequest_folioItemId_key" ON "ExperienceRequest"("folioItemId");

-- CreateIndex
CREATE INDEX "ExperienceRequest_bookingId_idx" ON "ExperienceRequest"("bookingId");

-- CreateIndex
CREATE INDEX "ExperienceRequest_status_idx" ON "ExperienceRequest"("status");

-- CreateIndex
CREATE INDEX "ExperienceRequest_catalogItemId_idx" ON "ExperienceRequest"("catalogItemId");

-- CreateIndex
CREATE INDEX "ExperienceRequest_breezeWayTaskId_idx" ON "ExperienceRequest"("breezeWayTaskId");

-- CreateIndex
CREATE INDEX "FolioItem_bookingId_idx" ON "FolioItem"("bookingId");

-- CreateIndex
CREATE INDEX "FolioItem_type_idx" ON "FolioItem"("type");

-- CreateIndex
CREATE INDEX "FolioItem_createdAt_idx" ON "FolioItem"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

-- CreateIndex
CREATE INDEX "Notification_recipientEmail_idx" ON "Notification"("recipientEmail");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_guestEmail_idx" ON "PushSubscription"("guestEmail");

-- CreateIndex
CREATE INDEX "PushSubscription_bookingId_idx" ON "PushSubscription"("bookingId");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE INDEX "StockMovement_inventoryItemId_idx" ON "StockMovement"("inventoryItemId");

-- CreateIndex
CREATE INDEX "ServiceEvent_estateSpace_idx" ON "ServiceEvent"("estateSpace");

-- CreateIndex
CREATE INDEX "ServiceEvent_timeBlock_idx" ON "ServiceEvent"("timeBlock");

-- CreateIndex
CREATE INDEX "ServiceEvent_occurredAt_idx" ON "ServiceEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "ServiceEvent_serviceType_idx" ON "ServiceEvent"("serviceType");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_bookingId_idx" ON "AuditLog"("bookingId");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_isDismissed_idx" ON "SystemAlert"("isDismissed");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_primaryGuestId_fkey" FOREIGN KEY ("primaryGuestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManifestGuest" ADD CONSTRAINT "ManifestGuest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManifestGuest" ADD CONSTRAINT "ManifestGuest_roomNumber_fkey" FOREIGN KEY ("roomNumber") REFERENCES "Room"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRating" ADD CONSTRAINT "VendorRating_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRating" ADD CONSTRAINT "VendorRating_experienceRequestId_fkey" FOREIGN KEY ("experienceRequestId") REFERENCES "ExperienceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceRequest" ADD CONSTRAINT "ExperienceRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceRequest" ADD CONSTRAINT "ExperienceRequest_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceRequest" ADD CONSTRAINT "ExperienceRequest_folioItemId_fkey" FOREIGN KEY ("folioItemId") REFERENCES "FolioItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolioItem" ADD CONSTRAINT "FolioItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
