'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { emInquiriesApi } from '@/lib/api/inquiries';
import type {
  DeclineInquiryDto,
  Inquiry,
  InquiryDetail,
  MarkPaymentLinkSentDto,
  ReviewInquiryDto,
} from '@repo/api-types';

export function useInquiries(status?: string) {
  return useQuery({
    queryKey: ['inquiries', status ?? 'all'],
    queryFn: () => emInquiriesApi.list(status),
    refetchInterval: 60_000,
  });
}

export function useNewInquiriesCount() {
  return useQuery({
    queryKey: ['inquiries', 'NEW'],
    queryFn: () => emInquiriesApi.list('NEW'),
    refetchInterval: 30_000,
    select: (data) => data.length,
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: ['inquiries', id],
    queryFn: () => emInquiriesApi.byId(id),
    enabled: Boolean(id),
  });
}

export function useApproveInquiry() {
  const queryClient = useQueryClient();
  return useMutation<Inquiry, Error, { id: string; dto: ReviewInquiryDto }>({
    mutationFn: ({ id, dto }) => emInquiriesApi.approve(id, dto),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['inquiries', id] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeclineInquiry() {
  const queryClient = useQueryClient();
  return useMutation<Inquiry, Error, { id: string; dto: DeclineInquiryDto }>({
    mutationFn: ({ id, dto }) => emInquiriesApi.decline(id, dto),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['inquiries', id] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Sends the branded lookbook + payment email — the guest's confirmation. */
export function useSendLookbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emInquiriesApi.sendLookbook(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}

export function useMarkLookbookSent() {
  const queryClient = useQueryClient();
  return useMutation<Inquiry, Error, string>({
    mutationFn: (id) => emInquiriesApi.markLookbookSent(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['inquiries', id] });
    },
  });
}

export function useMarkPaymentLinkSent() {
  const queryClient = useQueryClient();
  return useMutation<
    Inquiry,
    Error,
    { id: string; dto: MarkPaymentLinkSentDto }
  >({
    mutationFn: ({ id, dto }) => emInquiriesApi.markPaymentLinkSent(id, dto),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['inquiries', id] });
    },
  });
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => emInquiriesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export type { InquiryDetail };
