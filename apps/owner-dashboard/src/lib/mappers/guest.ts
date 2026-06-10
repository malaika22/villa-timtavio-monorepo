import type { GuestSummary } from '@repo/api-types';
import type { UpcomingStay } from '@/types';
import { format, parseISO } from 'date-fns';

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function mapGuestToUpcomingStay(guest: GuestSummary): UpcomingStay {
  const booking = (
    guest as GuestSummary & {
      primaryBookings?: {
        checkIn: string;
        checkOut: string;
        nights: number;
        totalGuests: number;
        status: string;
      }[];
    }
  ).primaryBookings?.[0];

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      return format(parseISO(d), 'MMM d, yyyy');
    } catch {
      return d;
    }
  };

  return {
    id: guest.id,
    guestName: `${guest.firstName} ${guest.lastName}`,
    guestInitials: initials(guest.firstName, guest.lastName),
    guestMeta: `${guest.totalVisits} visit${guest.totalVisits === 1 ? '' : 's'} · ${guest.email}`,
    villas: 'Villa TimTavio',
    arrival: formatDate(booking?.checkIn),
    departure: formatDate(booking?.checkOut),
    nights: booking?.nights ?? 0,
    party: booking?.totalGuests ?? 1,
    source: 'Direct',
    estRevenue: '—',
    status: 'confirmed' as const,
  };
}
