import { api, API } from '@/lib/api';
import type { DiningRequest } from '@repo/api-types';

export const emDiningApi = {
  byBooking: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.byBooking(bookingId)),
  confirm: (id: string) => api.patch<DiningRequest>(API.dining.confirm(id)),
  cancel: (id: string) => api.patch<DiningRequest>(API.dining.cancel(id)),
};
