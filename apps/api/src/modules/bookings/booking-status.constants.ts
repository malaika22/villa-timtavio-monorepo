import { BookingStatus } from '@prisma/client';

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CHECKED_IN,
  BookingStatus.SETTLED,
  BookingStatus.DEPARTURE_TODAY,
  BookingStatus.CONFIRMED,
];

export const CURRENT_STAY_STATUSES: BookingStatus[] = [
  BookingStatus.CHECKED_IN,
  BookingStatus.SETTLED,
  BookingStatus.DEPARTURE_TODAY,
];

export const COMPLETED_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CHECKED_OUT,
];
