import type { GuestProfile, GuestSummary } from '@repo/api-types';

import { stayRange } from '@/lib/stay-date';
import type { GuestDNAProfile, GuestListItem, GuestListStatus } from '@/types';

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
    partySize: booking?.totalGuests ?? 1,
    memberSince: guest.createdAt
      ? new Date(guest.createdAt).getFullYear().toString()
      : undefined,
    status: deriveListStatus(booking?.status, isPast),
    isPast,
    activeBookingId: booking?.id ?? null,
  };
}

export function mapGuestProfileToDNA(profile: GuestProfile): GuestDNAProfile {
  const latestNote = profile.crmNotes[0];
  const beverage = profile.beveragePreferences
    ? profile.beveragePreferences.split('\n').filter(Boolean)
    : [];
  // The active stay = first booking that hasn't ended.
  const activeBooking = profile.primaryBookings.find(
    (b) => b.status !== 'CHECKED_OUT' && b.status !== 'CANCELLED',
  );

  return {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`,
    initials: initials(profile.firstName, profile.lastName),
    summary: `${profile.stats.totalVisits} visits · Lifetime spend $${profile.stats.lifetimeSpend.toLocaleString()}`,
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
    stayActivity: [],
    stayHistory: [],
    activeBookingId: activeBooking?.id ?? null,
    bookingStatus: activeBooking?.status,
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
