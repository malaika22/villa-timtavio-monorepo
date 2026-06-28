import type { GuestStayStatus } from '@/types';
import type { BookingStatus } from '@repo/api-types';

export function mapBookingStatusToGuestStatus(
  status: BookingStatus,
): GuestStayStatus {
  switch (status) {
    case 'DEPARTURE_TODAY':
      return 'Departing';
    case 'CONFIRMED':
      return 'Arriving';
    case 'CHECKED_OUT':
      return 'Departed';
    default:
      return 'Settled';
  }
}
