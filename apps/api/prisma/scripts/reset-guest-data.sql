-- ─────────────────────────────────────────────────────────────────────────────
-- RESET GUEST / INQUIRY / MANIFEST / EXPERIENCES DATA  (fresh client start)
--
-- CLEARS (transactional + guest data):
--   Guest, Booking, Inquiry, ManifestGuest, ManifestDraft, ExperienceRequest,
--   DiningRequest, FolioItem, Notification, CrmNote, MagicToken, VendorRating,
--   SatisfactionReview, PushSubscription, ScheduleItem, AuditLog
--
-- KEEPS (client-configured content + infra):
--   CatalogItem, ExperienceCategory, MenuItem, Recommendation, Vendor, Room,
--   EstateSettings, StaffAccount, InventoryItem, StockMovement, Equipment,
--   ServiceEvent, SystemAlert, HealthSample
--
-- Single atomic TRUNCATE. CASCADE covers any FK-linked child rows; the plain
-- (non-FK) bookingId tables are listed explicitly so they're cleared too.
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE TABLE
  "Guest",
  "Booking",
  "Inquiry",
  "ManifestGuest",
  "ManifestDraft",
  "ExperienceRequest",
  "DiningRequest",
  "FolioItem",
  "Notification",
  "CrmNote",
  "MagicToken",
  "VendorRating",
  "SatisfactionReview",
  "PushSubscription",
  "ScheduleItem",
  "AuditLog"
RESTART IDENTITY CASCADE;
