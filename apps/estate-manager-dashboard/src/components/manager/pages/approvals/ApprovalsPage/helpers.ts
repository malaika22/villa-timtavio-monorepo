import {
  ApprovalFilterTab,
  ApprovalHorizon,
  ApprovalQueueItem,
} from '@/types';

export function filterBySearch(
  items: ApprovalQueueItem[],
  query: string,
): ApprovalQueueItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.guestName.toLowerCase().includes(q) ||
      i.experience.toLowerCase().includes(q) ||
      i.villa.toLowerCase().includes(q) ||
      i.vendor.toLowerCase().includes(q) ||
      // The primary's name, so searching for a party finds every secondary's
      // request too — otherwise grouping by stay gives you a heading you can't
      // search for.
      i.stayLabel.toLowerCase().includes(q),
  );
}

export function filterByTab(
  items: ApprovalQueueItem[],
  tab: ApprovalFilterTab,
): ApprovalQueueItem[] {
  switch (tab) {
    case 'pending':
      return items.filter((i) => i.status === 'Pending');
    case 'confirmed':
      return items.filter((i) => i.status === 'Confirmed');
    case 'in-progress':
      return items.filter((i) => i.status === 'In Progress');
    case 'completed':
      return items.filter((i) => i.status === 'Completed');
    case 'declined':
      return items.filter((i) => i.status === 'Declined');
    default:
      return items;
  }
}

const DAY = 24 * 60 * 60 * 1000;

/** Local midnight — the boundary a person means by "today", not 24h from now. */
function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function time(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * How far ahead the queue looks.
 *
 * The only filter that bounds the page. Every other one is categorical, so
 * "All requests" grows with every stay the estate ever takes — a queue is only
 * workable if something limits it to the period being worked on.
 *
 * A request with no usable date is never hidden: that's far more likely to be
 * broken data than something genuinely irrelevant, and dropping it silently
 * would make it unfixable.
 */
export function filterByHorizon(
  items: ApprovalQueueItem[],
  horizon: ApprovalHorizon,
): ApprovalQueueItem[] {
  if (horizon === 'all') return items;

  const today = startOfToday();
  const ceiling =
    horizon === 'week'
      ? today + 7 * DAY
      : horizon === 'month'
        ? today + 30 * DAY
        : null;

  return items.filter((i) => {
    const at = time(i.experienceDate);
    if (at == null) return true;
    if (horizon === 'past') return at < today;
    if (at < today) return false;
    return ceiling == null || at < ceiling;
  });
}

export type StayGroup = {
  bookingId: string;
  stayLabel: string;
  stayDates: string;
  checkIn: number | null;
  items: ApprovalQueueItem[];
  /** Still live — declined and finished ones shouldn't inflate the workload. */
  openCount: number;
  /** Live but not yet costed. What the EM most often opens this page for. */
  awaitingPrice: number;
};

/** Sorts undated groups and rows last rather than to 1970. */
const DATELESS = Number.MAX_SAFE_INTEGER;

/**
 * One band per stay, soonest arrival first, experiences in date order within.
 *
 * Grouped by booking rather than by guest deliberately: a party's secondaries
 * aren't separate customers, and splitting Sara out of Malaika's booking hides
 * that Malaika is liable for what Sara ordered.
 *
 * Grouping does cost the global date sort — an experience happening tomorrow
 * can sit below a party arriving sooner — which is why groups lead with the
 * nearest arrival, and why the needs-pricing panel above stays the cross-party
 * triage view.
 */
export function groupByStay(items: ApprovalQueueItem[]): StayGroup[] {
  const groups = new Map<string, StayGroup>();

  for (const item of items) {
    const group = groups.get(item.bookingId) ?? {
      bookingId: item.bookingId,
      stayLabel: item.stayLabel,
      stayDates: item.stayDates,
      checkIn: time(item.stayCheckIn),
      items: [],
      openCount: 0,
      awaitingPrice: 0,
    };
    group.items.push(item);
    if (item.status !== 'Declined' && item.status !== 'Completed') {
      group.openCount += 1;
      if (item.confirmedCost == null) group.awaitingPrice += 1;
    }
    groups.set(item.bookingId, group);
  }

  return Array.from(groups.values())
    .map((g) => ({
      ...g,
      items: g.items
        .slice()
        .sort(
          (a, b) =>
            (time(a.experienceDate) ?? DATELESS) -
            (time(b.experienceDate) ?? DATELESS),
        ),
    }))
    .sort((a, b) => (a.checkIn ?? DATELESS) - (b.checkIn ?? DATELESS));
}
