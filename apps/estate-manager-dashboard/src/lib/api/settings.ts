import { api, API } from '@/lib/api';
import type {
  EstateSettings,
  IntegrationStatus,
  StaffAccount,
  StaffRole,
} from '@repo/api-types';

export const settingsApi = {
  get: () => api.get<EstateSettings>(API.settings.get),
  update: (dto: Partial<EstateSettings>) =>
    api.patch<EstateSettings>(API.settings.get, dto),

  listStaff: () => api.get<StaffAccount[]>(API.settings.staff),
  createStaff: (dto: { name: string; email: string; role?: StaffRole }) =>
    api.post<StaffAccount>(API.settings.staff, dto),
  updateStaff: (id: string, dto: { role?: StaffRole; active?: boolean }) =>
    api.patch<StaffAccount>(API.settings.staffById(id), dto),

  integrations: () => api.get<IntegrationStatus[]>(API.settings.integrations),
};
