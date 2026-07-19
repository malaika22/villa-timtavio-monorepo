import { api, API } from '@/lib/api';
import type {
  ManifestResponse,
  CreateManifestGuestDto,
  UpdateManifestGuestDto,
  ManifestDraftResponse,
  ManifestOptionsResponse,
  UpsertManifestDraftDto,
  UpdatePrimaryDetailsDto,
} from '@repo/api-types';

export const manifestApi = {
  getManifest: (bookingId: string) =>
    api.get<ManifestResponse>(API.manifest.byBooking(bookingId)),

  addGuest: (bookingId: string, dto: CreateManifestGuestDto) =>
    api.post<ManifestResponse['guests'][number]>(
      API.manifest.addGuest(bookingId),
      dto,
    ),

  updateGuest: (
    bookingId: string,
    guestId: string,
    dto: UpdateManifestGuestDto,
  ) =>
    api.patch<ManifestResponse['guests'][number]>(
      API.manifest.updateGuest(bookingId, guestId),
      dto,
    ),

  removeGuest: (bookingId: string, guestId: string) =>
    api.delete<{ message: string }>(
      API.manifest.removeGuest(bookingId, guestId),
    ),

  updatePrimaryDetails: (bookingId: string, dto: UpdatePrimaryDetailsDto) =>
    api.patch<ManifestResponse>(
      API.manifest.primaryDetails(bookingId),
      dto,
    ),

  submit: (bookingId: string) =>
    api.post<{ manifestStatus: string }>(API.manifest.submit(bookingId), {}),

  markLinkOpened: (bookingId: string, email: string) =>
    api.post<void>(API.manifest.linkOpened, { bookingId, email }),

  getOptions: () => api.get<ManifestOptionsResponse>(API.manifest.options),

  getDraft: (bookingId: string) =>
    api.get<ManifestDraftResponse | null>(API.manifest.draft(bookingId)),

  upsertDraft: (bookingId: string, dto: UpsertManifestDraftDto) =>
    api.put<ManifestDraftResponse>(API.manifest.draft(bookingId), dto),

  deleteDraft: (bookingId: string) =>
    api.delete<{ success: boolean }>(API.manifest.draft(bookingId)),
};
