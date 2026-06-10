import type { ExperienceHistoryItem } from '@repo/api-types';

import { API, api } from '@/lib/api';

interface ExperienceHistoryResponse {
  requests: ExperienceHistoryItem[];
  topExperiences: { name: string; count: number }[];
  totalCompleted: number;
}

export const crmApi = {
  getExperienceHistory: (guestId: string) =>
    api.get<ExperienceHistoryResponse>(API.crm.experienceHistory(guestId)),

  getNotes: (guestId: string) => api.get(API.crm.notes(guestId)),
};
