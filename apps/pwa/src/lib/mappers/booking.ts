import type { CurrentBooking } from '@repo/api-types';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { stayDateShort } from '@/lib/stay-date';

export interface HeroCardData {
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
}

export function mapBookingToHeroCard(booking: CurrentBooking): HeroCardData {
  return {
    // UTC, not the reader's timezone — see lib/stay-date. A stay date is a
    // calendar date, and rendering it locally moved every booking a day early
    // for anyone west of Greenwich.
    checkIn: stayDateShort(booking.checkIn),
    checkOut: stayDateShort(booking.checkOut),
    nights: booking.nights,
    guestCount: booking.totalGuests,
  };
}

export function mapBookingStatusToArrivalStatus(
  status: CurrentBooking['status'],
): ArrivalStatus {
  switch (status) {
    case 'CONFIRMED':
      return ArrivalStatus.PRE_ARRIVAL;
    case 'CHECKED_IN':
      return ArrivalStatus.CHECKED_IN;
    case 'SETTLED':
      return ArrivalStatus.SETTLED;
    case 'DEPARTURE_TODAY':
      return ArrivalStatus.DEPARTURE_TODAY;
    case 'CHECKED_OUT':
      return ArrivalStatus.CHECKOUT_OUT;
    default:
      return ArrivalStatus.PRE_ARRIVAL;
  }
}
