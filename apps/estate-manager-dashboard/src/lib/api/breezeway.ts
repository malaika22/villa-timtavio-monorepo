import { api, API } from '@/lib/api';
import type { BreezewayStaff } from '@repo/api-types';

export const emBreezewayApi = {
  staff: () => api.get<BreezewayStaff[]>(API.breezeway.staff),
};
