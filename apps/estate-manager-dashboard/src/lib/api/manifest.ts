import { api, API } from '@/lib/api';
import type { ManifestResponse, ChefsBriefResponse } from '@repo/api-types';

export const emManifestApi = {
  getManifest: (bookingId: string) =>
    api.get<ManifestResponse>(API.manifest.byBooking(bookingId)),

  approve: (bookingId: string) =>
    api.post<{ manifestStatus: string }>(API.manifest.approve(bookingId), {}),

  chefsBrief: (bookingId: string) =>
    api.get<ChefsBriefResponse>(API.manifest.chefsBrief(bookingId)),

  resendLink: (bookingId: string, guestId: string) =>
    api.post<{ message: string }>(
      API.manifest.resendLink(bookingId, guestId),
      {},
    ),
};
