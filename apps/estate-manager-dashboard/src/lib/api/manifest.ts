import { api, API } from '@/lib/api';
import type {
  ManifestResponse,
  ChefsBriefResponse,
  ManifestGuest,
  UpdateManifestGuestDto,
  GuestArrivalStatus,
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

  setGuestArrivalStatus: (
    bookingId: string,
    guestId: string,
    status: GuestArrivalStatus,
  ) =>
    api.patch<ManifestGuest>(
      API.manifest.guestArrivalStatus(bookingId, guestId),
      { status },
    ),

  setPrimaryArrivalStatus: (bookingId: string, status: GuestArrivalStatus) =>
    api.patch<{ id: string }>(API.manifest.primaryArrivalStatus(bookingId), {
      status,
    }),

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
