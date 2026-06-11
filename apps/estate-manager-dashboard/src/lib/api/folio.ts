import { api, API } from '@/lib/api';
import type {
  DailyRevenue,
  FolioResponse,
  CreateFolioItemDto,
  UpdateFolioItemDto,
  FolioItem,
} from '@repo/api-types';

export const emFolioApi = {
  dailyRevenue: () => api.get<DailyRevenue>(API.folio.dailyRevenue),

  byBooking: (bookingId: string) =>
    api.get<FolioResponse>(API.folio.byBooking(bookingId)),
  addCharge: (bookingId: string, dto: CreateFolioItemDto) =>
    api.post<FolioItem>(API.folio.charges(bookingId), dto),
  updateCharge: (itemId: string, dto: UpdateFolioItemDto) =>
    api.patch<FolioItem>(API.folio.chargeById(itemId), dto),
  checkout: (bookingId: string) =>
    api.post<void>(API.folio.checkout(bookingId)),
};
