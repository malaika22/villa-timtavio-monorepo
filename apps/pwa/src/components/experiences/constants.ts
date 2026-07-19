import { BookingStatus } from '@repo/api-types';

export const PAGE_SIZE = 4;

export const bookingStatusMap: Record<string, BookingStatus> = {
  'pre-arrival': 'CONFIRMED',
  'checked-in': 'CHECKED_IN',
  settled: 'SETTLED',
  'departure-today': 'DEPARTURE_TODAY',
  'checkout-out': 'CHECKED_OUT',
};
