import { api, API } from '@/lib/api';
import type { CurrentBooking } from '@repo/api-types';

export const bookingsApi = {
  getCurrent: () => api.get<CurrentBooking>(API.bookings.current),
};
