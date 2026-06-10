import { create } from 'zustand';
import type { CurrentBooking } from '@repo/api-types';
import { ArrivalStatus } from '@/types/arrivalStatus';
import { mapBookingStatusToArrivalStatus } from '@/lib/mappers/booking';

interface BookingState {
  bookingId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  manifestStatus: string | null;
  arrivalStatus: ArrivalStatus | null;
  totalGuests: number | null;
  nights: number | null;
  setBooking: (booking: CurrentBooking) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookingId: null,
  checkIn: null,
  checkOut: null,
  manifestStatus: null,
  arrivalStatus: null,
  totalGuests: null,
  nights: null,

  setBooking: (booking: CurrentBooking) =>
    set({
      bookingId: booking.id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      manifestStatus: booking.manifestStatus,
      arrivalStatus: mapBookingStatusToArrivalStatus(booking.status),
      totalGuests: booking.totalGuests,
      nights: booking.nights,
    }),

  clearBooking: () =>
    set({
      bookingId: null,
      checkIn: null,
      checkOut: null,
      manifestStatus: null,
      arrivalStatus: null,
      totalGuests: null,
      nights: null,
    }),
}));
