import type { BookingStatus } from '@repo/api-types';

export const STATUS_CYCLE: BookingStatus[] = [
  'CONFIRMED',
  'CHECKED_IN',
  'SETTLED',
  'DEPARTURE_TODAY',
  'CHECKED_OUT',
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  SETTLED: 'Settled',
  DEPARTURE_TODAY: 'Departing today',
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
};
