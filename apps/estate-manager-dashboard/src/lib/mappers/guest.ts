import type { GuestProfile, GuestSummary } from '@repo/api-types';

import type { GuestDNAProfile, GuestListItem } from '@/types';

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDateRange(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return 'Dates TBD';
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(inDate)} – ${fmt(outDate)}`;
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
    partySize: booking?.totalGuests ?? 2,
    memberSince: guest.createdAt
      ? new Date(guest.createdAt).getFullYear().toString()
      : undefined,
    status: isPast ? 'Departed' : 'Settled',
    isPast,
    activeBookingId: booking?.id ?? null,
  };
}

export function mapGuestProfileToDNA(profile: GuestProfile): GuestDNAProfile {
  const latestNote = profile.crmNotes[0];
  const beverage = profile.beveragePreferences
    ? profile.beveragePreferences.split('\n').filter(Boolean)
    : [];

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
  };
}
