import type { CurrentBooking } from '@repo/api-types';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { format, parseISO } from 'date-fns';

export interface HeroCardData {
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
}

export function mapBookingToHeroCard(booking: CurrentBooking): HeroCardData {
  return {
    checkIn: format(parseISO(booking.checkIn), 'MMM d'),
    checkOut: format(parseISO(booking.checkOut), 'MMM d'),
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
