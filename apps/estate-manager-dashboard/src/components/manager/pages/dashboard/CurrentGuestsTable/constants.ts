import type { BookingStatus } from '@repo/api-types';

export const STATUS_CYCLE: BookingStatus[] = [
  'CONFIRMED',
  'CHECKED_IN',
  'SETTLED',
  'DEPARTURE_TODAY',
  'CHECKED_OUT',
];
