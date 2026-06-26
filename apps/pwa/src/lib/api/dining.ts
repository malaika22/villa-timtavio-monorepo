import { api, API } from '@/lib/api';
import type { CreateDiningRequestDto, DiningRequest } from '@repo/api-types';

export const diningApi = {
  byBooking: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.byBooking(bookingId)),
  create: (bookingId: string, dto: CreateDiningRequestDto) =>
    api.post<DiningRequest>(API.dining.create(bookingId), dto),
};
