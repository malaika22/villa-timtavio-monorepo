import type {
  GuestProfile,
  GuestSummary,
  GuestWithBookings,
  UpdateGuestDnaDto,
} from '@repo/api-types';

import { API, api } from '@/lib/api';

export const guestsApi = {
  getCurrent: () => api.get<GuestWithBookings[]>(API.guests.current),

  getPast: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<GuestSummary[]>(`${API.guests.past}${query}`);
  },

  getProfile: (id: string) => api.get<GuestProfile>(API.guests.profile(id)),

  updateDna: (id: string, dto: UpdateGuestDnaDto) =>
    api.patch<GuestProfile>(API.guests.dna(id), dto),
};
