import { api, API } from '@/lib/api';
import type {
  CreateDiningRequestDto,
  DiningRequest,
  SittingTimes,
  AddLateArrivalDto,
} from '@repo/api-types';

export const diningApi = {
  byBooking: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.byBooking(bookingId)),
  create: (bookingId: string, dto: CreateDiningRequestDto) =>
    api.post<DiningRequest>(API.dining.create(bookingId), dto),
  sittingTimes: () => api.get<SittingTimes>(API.dining.sittingTimes),
  addLateArrival: (id: string, dto: AddLateArrivalDto) =>
    api.post<DiningRequest>(API.dining.lateArrival(id), dto),
};
