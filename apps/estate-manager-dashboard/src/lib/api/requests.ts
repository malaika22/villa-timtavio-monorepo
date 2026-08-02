import { api, API } from '@/lib/api';
import type {
  EmExperienceRequest,
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
  cancellationRequests: () =>
    api.get<ExperienceRequest[]>(API.requests.emCancellationRequests),
  confirmCancellation: (id: string, cancellationFee?: number) =>
    api.post<ExperienceRequest>(API.requests.confirmCancellation(id), {
      cancellationFee,
    }),
  confirmCost: (id: string, dto: ConfirmCostDto) =>
    api.patch<ExperienceRequest>(API.requests.confirmCost(id), dto),
  // QA test affordance — simulate Breezeway completion → guest READY.
  markReadyTest: (id: string) =>
    api.patch<ExperienceRequest>(API.requests.markReadyTest(id), {}),
};
