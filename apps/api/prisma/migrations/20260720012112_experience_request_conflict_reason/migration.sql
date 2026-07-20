-- Conflict engine: human-readable reason stored when a request is held in
-- CONFLICT (vendor/resource double-booked at an overlapping time).
ALTER TABLE "ExperienceRequest" ADD COLUMN "conflictReason" TEXT;
