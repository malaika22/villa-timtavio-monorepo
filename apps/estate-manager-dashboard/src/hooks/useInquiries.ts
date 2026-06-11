'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { emInquiriesApi } from '@/lib/api/inquiries';
import type {
  ReviewInquiryDto,
  DeclineInquiryDto,
  Inquiry,
} from '@repo/api-types';

export function useInquiries() {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: emInquiriesApi.list,
    refetchInterval: 60_000,
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
    },
  });
}
