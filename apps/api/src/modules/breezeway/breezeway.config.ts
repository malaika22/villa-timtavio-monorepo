// This Breezeway account has no teams configured — only individual people
// (GET /public/inventory/v1/people). So experience-setup tasks are assigned to
// a PERSON id rather than a team id. Culinary/Wellness fall back to Concierge
// when unset, so a single-manager estate routes everything to one person; split
// them out later by setting the dedicated env vars once specialists are hired.
const CONCIERGE = process.env.BREEZEWAY_CONCIERGE_PERSON_ID || '';
const CULINARY = process.env.BREEZEWAY_CULINARY_PERSON_ID || CONCIERGE;
const WELLNESS = process.env.BREEZEWAY_WELLNESS_PERSON_ID || CONCIERGE;

export const BREEZEWAY_ASSIGNEE_MAP: Record<string, string> = {
  INCLUDED: CONCIERGE,
  ARRIVAL_TRANSIT: CONCIERGE,
  WELLNESS: WELLNESS,
  CULINARY_AGAVE: CULINARY,
  OCEAN_ADVENTURE: CONCIERGE,
  EXCURSIONS: CONCIERGE,
  PRIVATE: CONCIERGE,
};

export const EXPERIENCE_LEAD_TIMES: Record<string, number> = {
  INCLUDED: 30,
  ARRIVAL_TRANSIT: 120,
  WELLNESS: 60,
  CULINARY_AGAVE: 180,
  OCEAN_ADVENTURE: 45,
  EXCURSIONS: 240,
  PRIVATE: 60,
};

/**
 * How far ahead of an experience its setup task is created.
 *
 * Tasks used to appear the moment a price was agreed. That was fine when
 * pricing happened hours before the experience; now a guest can plan in August
 * and a supplier can quote the same week, which would leave a task sitting in
 * Breezeway for a month — long enough to be scrolled past, actioned early, or
 * quietly forgotten.
 */
export const BREEZEWAY_TASK_LEAD_DAYS = 3;

/** Whether an experience is close enough for its setup task to be created. */
export function isWithinTaskWindow(confirmedDate: Date | null): boolean {
  if (!confirmedDate) return false;
  const windowOpens =
    confirmedDate.getTime() - BREEZEWAY_TASK_LEAD_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() >= windowOpens;
}
