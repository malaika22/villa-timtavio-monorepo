import { api, API } from '@/lib/api';
import type {
  ExperienceRequest,
  ConfirmRequestDto,
  ConfirmCostDto,
  DeclineRequestDto,
} from '@repo/api-types';

export const emRequestsApi = {
  queue: () => api.get<ExperienceRequest[]>(API.requests.emQueue),
  active: () => api.get<ExperienceRequest[]>(API.requests.emActive),
  byId: (id: string) => api.get<ExperienceRequest>(API.requests.byId(id)),
  approve: (id: string, dto: ConfirmRequestDto) =>
    api.post<ExperienceRequest>(API.requests.approve(id), dto),
  decline: (id: string, dto: DeclineRequestDto) =>
    api.post<ExperienceRequest>(API.requests.decline(id), dto),
  confirmCost: (id: string, dto: ConfirmCostDto) =>
    api.post<ExperienceRequest>(API.requests.confirmCost(id), dto),
};
