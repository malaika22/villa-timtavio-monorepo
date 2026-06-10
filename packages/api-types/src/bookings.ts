export type BookingStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface CurrentBooking {
  id: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  guestCount: number;
  primaryGuestId: string;
  manifestGuests?: unknown[];
  experienceRequests?: unknown[];
}
