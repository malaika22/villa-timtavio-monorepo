import { api, API } from '@/lib/api';
import type {
  DeclineInquiryDto,
  Inquiry,
  InquiryDetail,
  MarkPaymentLinkSentDto,
  ReviewInquiryDto,
} from '@repo/api-types';

export const emInquiriesApi = {
  list: (status?: string) =>
    api.get<Inquiry[]>(
      status ? `${API.inquiries.list}?status=${status}` : API.inquiries.list,
    ),
  byId: (id: string) => api.get<InquiryDetail>(API.inquiries.byId(id)),
  approve: (id: string, dto: ReviewInquiryDto) =>
    api.patch<Inquiry>(API.inquiries.approve(id), dto),
  decline: (id: string, dto: DeclineInquiryDto) =>
    api.patch<Inquiry>(API.inquiries.decline(id), dto),
  sendLookbook: (id: string) =>
    api.post<Inquiry>(API.inquiries.sendLookbook(id)),
  markLookbookSent: (id: string) =>
    api.patch<Inquiry>(API.inquiries.lookbookSent(id), {}),
  markPaymentLinkSent: (id: string, dto: MarkPaymentLinkSentDto) =>
    api.patch<Inquiry>(API.inquiries.paymentLinkSent(id), dto),
  remove: (id: string) =>
    api.delete<{ success: boolean }>(API.inquiries.delete(id)),
};
