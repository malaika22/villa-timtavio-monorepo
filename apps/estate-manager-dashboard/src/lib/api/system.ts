import { api, API } from '@/lib/api';
import type { LodgifySyncStatus, SystemAlert } from '@repo/api-types';

export const systemApi = {
  lodgifySyncStatus: () =>
    api.get<LodgifySyncStatus>(API.system.lodgifySyncStatus),

  alerts: (params?: { category?: string; isDismissed?: boolean | 'all' }) => {
    const search = new URLSearchParams();
    if (params?.category) search.set('category', params.category);
    if (params?.isDismissed !== undefined) {
      search.set('isDismissed', String(params.isDismissed));
    }
    const qs = search.toString();
    return api.get<SystemAlert[]>(`${API.system.alerts}${qs ? `?${qs}` : ''}`);
  },

  dismissAlert: (id: string) =>
    api.patch<SystemAlert>(API.system.dismissAlert(id)),

  markAllRead: () => api.post<void>(`${API.system.alerts}/read-all`),
};
