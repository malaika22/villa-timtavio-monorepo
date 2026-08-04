import { api, API } from '@/lib/api';
import type {
  ExperienceRequest,
  CreateExperienceRequestDto,
} from '@repo/api-types';

export const requestsApi = {
  byBooking: (bookingId: string, filter?: 'today' | 'active' | 'all') =>
    api.get<ExperienceRequest[]>(
      `${API.requests.byBooking(bookingId)}${filter ? `?filter=${filter}` : ''}`,
    ),
  byId: (id: string) => api.get<ExperienceRequest>(API.requests.byId(id)),
  pendingApproval: (bookingId: string) =>
    api.get<ExperienceRequest[]>(API.requests.pendingApproval(bookingId)),
  create: (bookingId: string, dto: CreateExperienceRequestDto) =>
    api.post<ExperienceRequest>(API.requests.create(bookingId), dto),
  primaryApprove: (id: string) =>
    api.post<ExperienceRequest>(API.requests.primaryApprove(id)),
  primaryDecline: (id: string, reason: string) =>
    api.post<ExperienceRequest>(API.requests.primaryDecline(id), { reason }),
  // Revised quotes that came in materially above the approved estimate.
  pendingQuoteApproval: (bookingId: string) =>
    api.get<ExperienceRequest[]>(API.requests.pendingQuoteApproval(bookingId)),
  approveQuote: (id: string) =>
    api.post<ExperienceRequest>(API.requests.approveQuote(id)),
  declineQuote: (id: string, reason?: string) =>
    api.post<ExperienceRequest>(API.requests.declineQuote(id), { reason }),
  // Withdrawn outright if unconfirmed; otherwise a request for the estate.
  cancel: (id: string, reason?: string) =>
    api.post<ExperienceRequest & { withdrawn: boolean }>(
      API.requests.cancel(id),
      { reason },
    ),
  /** Windows the estate has already committed for this experience. */
  takenSlots: (bookingId: string, catalogItemId: string) =>
    api.get<{ date: string; time: string | null }[]>(
      API.takenSlots(bookingId, catalogItemId),
    ),
};
