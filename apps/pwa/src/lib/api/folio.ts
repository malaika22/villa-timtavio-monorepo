import { api, API } from '@/lib/api';
import type { FolioResponse } from '@repo/api-types';

export const folioApi = {
  byBooking: (bookingId: string) =>
    api.get<FolioResponse>(API.folio.byBooking(bookingId)),
};
