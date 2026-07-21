import { api, API } from '@/lib/api';
import type { DiningRequest, SittingTimes } from '@repo/api-types';

export const emDiningApi = {
  byBooking: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.byBooking(bookingId)),
  confirm: (id: string) => api.patch<DiningRequest>(API.dining.confirm(id)),
  cancel: (id: string) => api.patch<DiningRequest>(API.dining.cancel(id)),
  getSittingTimes: () => api.get<SittingTimes>(API.dining.sittingTimes),
  updateSittingTimes: (dto: SittingTimes) =>
    api.patch<SittingTimes>(API.dining.sittingTimes, dto),
};
