import { api, API } from '@/lib/api';
import type {
  EmExperienceRequest,
  RecordVendorCancellationDto,
  RecordVendorReplyDto,
  VendorMessageDraft,
  ExperienceRequest,
  ConfirmRequestDto,
  ConfirmCostDto,
  DeclineRequestDto,
} from '@repo/api-types';

export const emRequestsApi = {
  queue: () => api.get<EmExperienceRequest[]>(API.requests.emQueue),
  active: () => api.get<EmExperienceRequest[]>(API.requests.emActive),
  today: () => api.get<EmExperienceRequest[]>(API.requests.emToday),
  history: () => api.get<EmExperienceRequest[]>(API.requests.emHistory),
  byId: (id: string) => api.get<ExperienceRequest>(API.requests.byId(id)),
  approve: (id: string, dto: ConfirmRequestDto) =>
    api.patch<ExperienceRequest>(API.requests.approve(id), dto),
  decline: (id: string, dto: DeclineRequestDto) =>
    api.patch<ExperienceRequest>(API.requests.decline(id), dto),
  needsPricing: () =>
    api.get<ExperienceRequest[]>(API.requests.emNeedsPricing),
  // EmExperienceRequest, not ExperienceRequest: these rows carry the vendor,
  // and unwinding a booking means telling somebody by name.
  cancellationRequests: () =>
    api.get<EmExperienceRequest[]>(API.requests.emCancellationRequests),
  confirmCancellation: (id: string, cancellationFee?: number) =>
    api.post<ExperienceRequest>(API.requests.confirmCancellation(id), {
      cancellationFee,
    }),
  confirmCost: (id: string, dto: ConfirmCostDto) =>
    api.patch<ExperienceRequest>(API.requests.confirmCost(id), dto),
  // QA test affordance — simulate Breezeway completion → guest READY.
  markReadyTest: (id: string) =>
    api.patch<ExperienceRequest>(API.requests.markReadyTest(id), {}),

  // ── Booking the vendor ──────────────────────────────────────────────────
  vendorMessage: (id: string) =>
    api.get<VendorMessageDraft>(API.vendorBooking.message(id)),
  vendorAsked: (id: string) =>
    api.post<ExperienceRequest>(API.vendorBooking.asked(id), {}),
  vendorReply: (id: string, dto: RecordVendorReplyDto) =>
    api.post<ExperienceRequest>(API.vendorBooking.reply(id), dto),

  // ── Unwinding it with the vendor ────────────────────────────────────────
  vendorCancelMessage: (id: string) =>
    api.get<VendorMessageDraft>(API.vendorBooking.cancelMessage(id)),
  vendorCancelSent: (id: string) =>
    api.post<ExperienceRequest>(API.vendorBooking.cancelSent(id), {}),
  vendorCancelReply: (id: string, dto: RecordVendorCancellationDto) =>
    api.post<ExperienceRequest>(API.vendorBooking.cancelReply(id), dto),
};
