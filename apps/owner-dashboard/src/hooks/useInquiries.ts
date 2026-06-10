import { useQuery } from '@tanstack/react-query';
import { ownerInquiriesApi } from '@/lib/api/inquiries';

export function useInquiries() {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: ownerInquiriesApi.list,
    staleTime: 60_000,
  });
}

export function useInquiryById(id: string | null) {
  return useQuery({
    queryKey: ['inquiries', id],
    queryFn: () => ownerInquiriesApi.byId(id!),
    enabled: !!id,
  });
}
