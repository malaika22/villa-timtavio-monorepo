import { api, API } from '@/lib/api';
import type {
  ManifestResponse,
  ChefsBriefResponse,
  ManifestGuest,
  UpdateManifestGuestDto,
} from '@repo/api-types';

export const emManifestApi = {
  getManifest: (bookingId: string) =>
    api.get<ManifestResponse>(API.manifest.byBooking(bookingId)),

  updateGuest: (
    bookingId: string,
    guestId: string,
    dto: UpdateManifestGuestDto,
  ) =>
    api.patch<ManifestGuest>(API.manifest.updateGuest(bookingId, guestId), dto),

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
