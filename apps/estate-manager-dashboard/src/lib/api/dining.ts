import { api, API } from '@/lib/api';
import type {
  DiningRequest,
  EmDiningQueueItem,
  SittingTimes,
} from '@repo/api-types';

export const emDiningApi = {
  byBooking: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.byBooking(bookingId)),
  queue: () => api.get<EmDiningQueueItem[]>(API.dining.queue),
  confirm: (id: string) => api.patch<DiningRequest>(API.dining.confirm(id)),
  cancel: (id: string) => api.patch<DiningRequest>(API.dining.cancel(id)),
  getSittingTimes: () => api.get<SittingTimes>(API.dining.sittingTimes),
  updateSittingTimes: (dto: SittingTimes) =>
    api.patch<SittingTimes>(API.dining.sittingTimes, dto),
};
