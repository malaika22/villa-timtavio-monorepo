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
    default:
      return 'Settled';
  }
}
