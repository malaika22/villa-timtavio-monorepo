import type { GuestProfile, GuestSummary } from '@repo/api-types';

import { API, api } from '@/lib/api';

export const guestsApi = {
  getCurrent: () => api.get<GuestSummary[]>(API.guests.current),
  getUpcoming: () => api.get<GuestSummary[]>(API.guests.upcoming),
  getPast: () => api.get<GuestSummary[]>(API.guests.past),
  getProfile: (id: string) => api.get<GuestProfile>(API.guests.profile(id)),
};
