import { api, API } from '@/lib/api';
import type {
  CurrentBooking,
  EmCurrentBookingDetail,
  UpdateBookingStatusDto,
} from '@repo/api-types';

export const emBookingsApi = {
  currentActive: () =>
    api.get<EmCurrentBookingDetail | null>(API.bookings.currentActive),
  approveManifest: (bookingId: string) =>
    api.post<CurrentBooking>(API.bookings.approveManifest(bookingId)),
  updateStatus: (bookingId: string, dto: UpdateBookingStatusDto) =>
    api.patch<CurrentBooking>(API.bookings.status(bookingId), dto),
};
