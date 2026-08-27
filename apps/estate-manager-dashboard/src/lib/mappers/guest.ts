import type {
  BookingDetailForGuest,
  GuestProfile,
  GuestSummary,
} from '@repo/api-types';

import { stayDateWithYear, stayRange } from '@/lib/stay-date';
import type {
  GuestDNAProfile,
  GuestListItem,
  GuestListStatus,
  GuestStayActivityStatus,
} from '@/types';

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Derive the guest-list badge from the real booking status instead of a
// hardcoded value, so an arriving/departing guest isn't mislabelled "Settled".
function deriveListStatus(
  status: string | undefined,
  isPast: boolean,
): GuestListStatus {
  if (isPast) return 'Departed';
  switch (status) {
    case 'DEPARTURE_TODAY':
      return 'Departing';
    case 'CONFIRMED':
      return 'Arriving';
    case 'CHECKED_IN':
      return 'Checked in';
    case 'SETTLED':
      return 'Settled';
    case 'CHECKED_OUT':
    case 'CANCELLED':
      return 'Departed';
    default:
      // Deliberately not 'Settled'. That asserts a guest has arrived and paid,
      // which is the last thing an unknown status should claim — and it is
      // exactly what a missing booking used to make this say.
      return 'Arriving';
  }
}

/**
 * Stay dates are calendar dates, so they're formatted in UTC — see
 * lib/stay-date. Rendering them in the browser's timezone showed every booking
 * a day early for anyone west of Greenwich, which is how a 17–18 September
 * reservation appeared here as 16–17.
 */
function formatDateRange(checkIn?: string, checkOut?: string) {
  return stayRange(checkIn, checkOut);
}

export function mapGuestSummaryToListItem(
  guest: GuestSummary & {
    primaryBookings?: {
      id: string;
      checkIn: string;
      checkOut: string;
      status: string;
      totalGuests?: number;
    }[];
  },
  isPast = false,
): GuestListItem {
  const booking = guest.primaryBookings?.[0];
  return {
    id: guest.id,
    name: `${guest.firstName} ${guest.lastName}`,
    initials: initials(guest.firstName, guest.lastName),
    villa: 'Villa TimTavio',
    dates: booking
      ? formatDateRange(booking.checkIn, booking.checkOut)
      : 'Dates TBD',
    checkIn: booking?.checkIn,
    partySize: booking?.totalGuests ?? 1,
    memberSince: guest.createdAt
      ? new Date(guest.createdAt).getFullYear().toString()
      : undefined,
    status: deriveListStatus(booking?.status, isPast),
    isPast,
    activeBookingId: booking?.id ?? null,
  };
}

const ORDINAL_SUFFIX = ['th', 'st', 'nd', 'rd'];

function ordinal(n: number): string {
  const v = n % 100;
  return `${n}${ORDINAL_SUFFIX[(v - 20) % 10] ?? ORDINAL_SUFFIX[v] ?? ORDINAL_SUFFIX[0]}`;
}

/** Whole days from today to a stay date, both taken as calendar dates. */
function daysAway(iso: string): number {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.round((new Date(iso).getTime() - todayUtc) / 86_400_000);
}

/**
 * Where the guest is in their stay, in words.
 *
 * "0 visits · Lifetime spend $0" was the only line under a first-timer's name,
 * and it reads as a failed query rather than a fact. What Rodrigo wants from
 * that line is when they turn up.
 */
function stayPhrase(booking: BookingDetailForGuest | undefined): string | null {
  if (!booking) return null;

  if (booking.status === 'CHECKED_IN' || booking.status === 'SETTLED') {
    const out = daysAway(booking.checkOut);
    if (out <= 0) return 'in residence';
    return out === 1
      ? 'in residence, leaving tomorrow'
      : `in residence, ${out} nights left`;
  }
  if (booking.status === 'DEPARTURE_TODAY') return 'departing today';
  if (booking.status === 'CHECKED_OUT') return 'departed';
  if (booking.status === 'CANCELLED') return 'cancelled';

  const inDays = daysAway(booking.checkIn);
  if (inDays === 0) return 'arriving today';
  if (inDays === 1) return 'arriving tomorrow';
  if (inDays > 1) return `arriving in ${inDays} days`;
  // Confirmed, but the arrival date has passed. Saying "arriving" would be a
  // lie the old list told for weeks; saying nothing hides a stay nobody closed.
  return `arrival was ${Math.abs(inDays)} days ago`;
}

function summaryLine(
  visits: number,
  spend: number,
  booking: BookingDetailForGuest | undefined,
): string {
  const head =
    visits === 0
      ? 'First stay'
      : `${ordinal(visits)} visit · lifetime spend $${spend.toLocaleString()}`;
  const phrase = stayPhrase(booking);
  return phrase ? `${head} · ${phrase}` : head;
}

const folioTotal = (booking: BookingDetailForGuest): number =>
  (booking.folioItems ?? []).reduce(
    (sum, item) => sum + Number(item.amount) * item.quantity,
    0,
  );

const ACTIVITY_STATUS: Record<string, GuestStayActivityStatus> = {
  COMPLETED: 'Completed',
  READY: 'Completed',
  CONFIRMED: 'Completed',
  IN_PROGRESS: 'Pending',
  PENDING: 'Pending',
  CONFLICT: 'Conflict',
  CANCELLED: 'Conflict',
};

const OUTCOME: Record<string, string> = {
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
  CHECKED_IN: 'In residence',
  SETTLED: 'In residence',
  DEPARTURE_TODAY: 'Departing today',
  CONFIRMED: 'Upcoming',
};

export function mapGuestProfileToDNA(profile: GuestProfile): GuestDNAProfile {
  const latestNote = profile.crmNotes[0];
  const beverage = profile.beveragePreferences
    ? profile.beveragePreferences.split('\n').filter(Boolean)
    : [];
  /**
   * The stay they are on, or the next one they arrive for.
   *
   * The API returns bookings newest check-in first, and this took the first
   * that had not ended — which is the *furthest* future stay, not the nearest.
   * A guest with two upcoming bookings had the later one described as "this
   * stay", and its dates, party size and manifest badge read as though they
   * belonged to the visit about to happen.
   *
   * A stay under way wins over one still to come, and among those still to
   * come the soonest wins.
   */
  const live = profile.primaryBookings.filter(
    (b) => b.status !== 'CHECKED_OUT' && b.status !== 'CANCELLED',
  );
  const activeBooking =
    live.find(
      (b) =>
        b.status === 'CHECKED_IN' ||
        b.status === 'SETTLED' ||
        b.status === 'DEPARTURE_TODAY',
    ) ?? [...live].sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];

  return {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`,
    initials: initials(profile.firstName, profile.lastName),
    summary: summaryLine(
      profile.stats.totalVisits,
      profile.stats.lifetimeSpend,
      activeBooking,
    ),
    email: profile.email,
    phone: profile.phone ?? null,
    tags: profile.favouriteExperiences ?? [],
    dietary: profile.dietaryRestrictions ?? [],
    beverage,
    experiencePrefs: profile.favouriteExperiences ?? [],
    roomSetup: profile.preStockSuggestions
      .filter((s) => s.type === 'ROOM_SETUP')
      .map((s) => ({ label: 'Setup', value: s.description })),
    staffNote: latestNote
      ? {
          text: latestNote.note,
          author: latestNote.addedBy,
          date: new Date(latestNote.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        }
      : { text: 'No staff notes yet.', author: '—', date: '—' },
    // Both of these were literal empty arrays, so the panel said "no activity
    // recorded" and "no prior stays on file" to every guest who ever opened
    // it — including one on their fifth visit. The endpoint has always sent
    // the bookings, their folio lines and their experience requests.
    stayActivity: (activeBooking?.experienceRequests ?? []).map((req) => ({
      id: req.id,
      experience: req.catalogItem?.name ?? 'Experience',
      date: stayDateWithYear(req.confirmedDate ?? req.preferredDate),
      status: ACTIVITY_STATUS[req.status] ?? 'Pending',
    })),
    stayHistory: profile.primaryBookings.map((booking) => ({
      id: booking.id,
      visit: stayRange(booking.checkIn, booking.checkOut),
      isCurrent: booking.id === activeBooking?.id,
      villa: 'Villa TimTavio',
      duration: `${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`,
      outcome: OUTCOME[booking.status] ?? booking.status,
      // Dashes rather than $0: a stay with no folio lines has not been
      // charged, which is a different statement from one that cost nothing.
      folioTotal:
        (booking.folioItems ?? []).length === 0
          ? '—'
          : `$${folioTotal(booking).toLocaleString()}`,
    })),
    activeBookingId: activeBooking?.id ?? null,
    bookingStatus: activeBooking?.status,
    stay: activeBooking
      ? {
          id: activeBooking.id,
          checkIn: activeBooking.checkIn,
          checkOut: activeBooking.checkOut,
          nights: activeBooking.nights,
          totalGuests: activeBooking.totalGuests,
          roomNumber: activeBooking.primaryRoomNumber ?? null,
          manifestStatus: activeBooking.manifestStatus,
          status: activeBooking.status,
        }
      : null,
    totalVisits: profile.stats.totalVisits,
    lifetimeSpend: profile.stats.lifetimeSpend,
    specialOccasions: profile.specialOccasions,
    raw: {
      allergies: profile.allergies ?? null,
      beveragePreferences: profile.beveragePreferences ?? null,
      winePreferences: profile.winePreferences ?? null,
      dietaryRestrictions: profile.dietaryRestrictions ?? [],
      favouriteExperiences: profile.favouriteExperiences ?? [],
      preferredTimes: profile.preferredTimes ?? null,
      pillarPreferences: profile.pillarPreferences ?? null,
    },
    preStock: profile.preStockSuggestions
      .filter((s) => s.type !== 'ROOM_SETUP')
      .map((s) => ({ description: s.description, source: s.source })),
  };
}
