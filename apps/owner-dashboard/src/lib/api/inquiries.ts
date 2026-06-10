import { api, API } from '@/lib/api';
import type { Inquiry } from '@repo/api-types';

export const ownerInquiriesApi = {
  list: () => api.get<Inquiry[]>(API.inquiries.list),
  byId: (id: string) => api.get<Inquiry>(API.inquiries.byId(id)),
};
