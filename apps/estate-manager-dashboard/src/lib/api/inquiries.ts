import { api, API } from '@/lib/api';
import type {
  Inquiry,
  ReviewInquiryDto,
  DeclineInquiryDto,
} from '@repo/api-types';

export const emInquiriesApi = {
  list: () => api.get<Inquiry[]>(API.inquiries.list),
  byId: (id: string) => api.get<Inquiry>(API.inquiries.byId(id)),
  approve: (id: string, dto: ReviewInquiryDto) =>
    api.patch<Inquiry>(API.inquiries.approve(id), dto),
  decline: (id: string, dto: DeclineInquiryDto) =>
    api.patch<Inquiry>(API.inquiries.decline(id), dto),
};
