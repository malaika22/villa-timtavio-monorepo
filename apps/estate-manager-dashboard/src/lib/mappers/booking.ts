import type { EmCurrentBookingDetail } from '@repo/api-types';
import type {
  ChecklistItemStatus,
  CurrentBooking,
  ExperienceRequestStatus,
} from '@/types';

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'In residence',
  SETTLED: 'Settled',
  DEPARTURE_TODAY: 'Departing today',
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
};

function initialsOf(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function fmtDay(d: Date): number {
  return d.getDate();
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "14–21 May 2026" or "28 Apr – 3 May 2026" */
function formatDateRange(checkIn: string, checkOut: string): string {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const sameMonth =
    a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${fmtDay(a)}–${fmtDay(b)} ${fmtMonthYear(a)}`;
  }
  const aLabel = a.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
  const bLabel = `${fmtDay(b)} ${fmtMonthYear(b)}`;
  return `${aLabel} – ${bLabel}`;
}

function formatArrivesIn(checkIn: string, status: string): string {
  if (['CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY'].includes(status)) {
    return 'In residence';
  }
  if (status === 'CHECKED_OUT') return 'Departed';
  const now = new Date();
  const ci = new Date(checkIn);
  const days = Math.ceil((ci.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return 'Arrival passed';
  if (days === 0) return 'Arrives today';
  return `Arrives in ${days} day${days === 1 ? '' : 's'}`;
}

function formatShortDate(value?: string | null): string {
  if (!value) return 'TBD';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function mapExperienceStatus(status: string): ExperienceRequestStatus {
  if (['CONFIRMED', 'READY', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
    return 'Confirmed';
  }
  return 'Pending';
}

function splitList(...values: (string | null | undefined)[]): string[] {
  return values
    .filter((v): v is string => !!v && v.trim().length > 0)
    .flatMap((v) => v.split(/[,\n;]/))
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function buildManifestAlert(
  manifestStatus: string,
  added: number,
  total: number,
  rooms: number,
): string {
  switch (manifestStatus) {
    case 'SUBMITTED':
      return `Guest manifest submitted — ${added} guest${added === 1 ? '' : 's'}, ${rooms} room${rooms === 1 ? '' : 's'}. Awaiting your review before check-in.`;
    case 'APPROVED':
      return `Guest manifest approved — ${added} of ${total} guests confirmed.`;
    case 'IN_PROGRESS':
      return `Guest manifest in progress — ${added} of ${total} guests added so far.`;
    default:
      return 'Guest manifest not started yet — awaiting the primary guest.';
  }
}

function buildChecklist(
  detail: EmCurrentBookingDetail,
): CurrentBooking['checklist'] {
  const { manifestStatus, status, manifestGuests, checkIn } = detail;
  // The primary's access link (tracked server-side as primaryLinkSent) OR any
  // secondary link sent OR manifest progress all count as "link sent".
  const linkSent =
    detail.primaryLinkSent === true ||
    manifestGuests.some((g) => g.pwaLinkSent) ||
    manifestStatus !== 'INCOMPLETE';
  const submitted = ['SUBMITTED', 'APPROVED'].includes(manifestStatus);
  const approved = manifestStatus === 'APPROVED';
  const checkedIn = [
    'CHECKED_IN',
    'SETTLED',
    'DEPARTURE_TODAY',
    'CHECKED_OUT',
  ].includes(status);

  const s = (cond: boolean, pending = false): ChecklistItemStatus =>
    cond ? 'completed' : pending ? 'pending' : 'upcoming';

  return [
    { id: 'c1', title: 'Booking confirmed', status: 'completed' },
    { id: 'c2', title: 'Magic link sent', status: s(linkSent) },
    {
      id: 'c3',
      title: 'Guest manifest submitted',
      status: submitted
        ? 'completed'
        : manifestStatus === 'IN_PROGRESS'
          ? 'pending'
          : 'upcoming',
    },
    {
      id: 'c4',
      title: 'Manifest review',
      status: approved ? 'completed' : s(submitted, submitted),
    },
    { id: 'c5', title: 'Room preparation', status: s(checkedIn) },
    {
      id: 'c6',
      title: 'Guest check-in',
      detail: formatShortDate(checkIn),
      status: s(checkedIn),
    },
  ];
}

export function mapToCurrentBooking(
  detail: EmCurrentBookingDetail,
): CurrentBooking {
  const { primaryGuest, manifestGuests, experienceRequests } = detail;

  const roomNumbers = Array.from(
    new Set(
      manifestGuests
        .map((g) => g.roomNumber)
        .filter((n): n is number => n != null),
    ),
  ).sort((a, b) => a - b);

  const roomsManifest = roomNumbers.map((n) => ({
    id: `r${n}`,
    label: `Room ${n}`,
    guestCount: manifestGuests.filter((g) => g.roomNumber === n).length,
  }));

  // Count the primary too (they're always part of the party but aren't a
  // ManifestGuest), so this matches the manifest drawer's "N of N guests".
  const added = manifestGuests.length + 1;
  const total = detail.totalGuests;
  const roomsUsed = roomNumbers.length;

  // Aggregate preferences across the whole party (primary + manifest guests),
  // so the EM sees everyone's dietary/allergy/beverage needs, not just the
  // primary member's.
  const dietary = dedupe([
    ...splitList(...primaryGuest.dietaryRestrictions),
    ...manifestGuests.flatMap((g) =>
      splitList(...(g.dietaryRestrictions ?? [])),
    ),
  ]);

  const allergyList = dedupe(
    [primaryGuest.allergies, ...manifestGuests.map((g) => g.allergies)].filter(
      (a): a is string => !!a && a.trim().length > 0,
    ),
  );
  // Surface allergies in the dietary chips too (highlighted as alerts).
  for (const a of allergyList) if (!dietary.includes(a)) dietary.push(a);

  const beverages = dedupe([
    ...splitList(
      primaryGuest.beveragePreferences,
      primaryGuest.winePreferences,
    ),
    ...manifestGuests.flatMap((g) => splitList(g.beveragePreferences)),
  ]);

  const tags = [
    `Party of ${total}`,
    roomsUsed > 0 ? `${roomsUsed} room${roomsUsed === 1 ? '' : 's'}` : null,
    STATUS_LABEL[detail.status] ?? detail.status,
  ].filter((t): t is string => !!t);

  return {
    id: detail.id,
    guestName: `${primaryGuest.firstName} ${primaryGuest.lastName}`.trim(),
    initials: initialsOf(primaryGuest.firstName, primaryGuest.lastName),
    dates: formatDateRange(detail.checkIn, detail.checkOut),
    nights: detail.nights,
    guests: total,
    rooms: roomsUsed,
    arrivesIn: formatArrivesIn(detail.checkIn, detail.status),
    tags,
    status: STATUS_LABEL[detail.status] ?? detail.status,
    manifestAlert: buildManifestAlert(
      detail.manifestStatus,
      added,
      total,
      roomsUsed,
    ),
    roomsManifest,
    manifestProgress: { added, total },
    experiences: experienceRequests.map((r) => ({
      id: r.id,
      name: r.catalogItem?.name ?? 'Experience',
      date: formatShortDate(r.confirmedDate ?? r.preferredDate),
      status: mapExperienceStatus(r.status),
    })),
    dietary,
    dietaryAlert: allergyList[0],
    beverages,
    roomSetup: '',
    staffNote: detail.internalNotes
      ? { text: detail.internalNotes, attribution: 'Internal note' }
      : { text: '', attribution: '' },
    checklist: buildChecklist(detail),
  };
}
