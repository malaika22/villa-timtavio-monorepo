import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '@/lib/api/requests';
import { useAuth } from './useAuth';
import type { CreateExperienceRequestDto } from '@repo/api-types';

export function useBookingRequests() {
  const { bookingId } = useAuth();
  return useQuery({
    queryKey: ['requests', bookingId],
    queryFn: () => requestsApi.byBooking(bookingId!),
    enabled: !!bookingId,
  });
}

export function useRequestById(id: string | null) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsApi.byId(id!),
    enabled: !!id,
  });
}

export function usePendingApprovalRequests() {
  const { bookingId } = useAuth();
  return useQuery({
    queryKey: ['requests', bookingId, 'pending-approval'],
    queryFn: () => requestsApi.pendingApproval(bookingId!),
    enabled: !!bookingId,
  });
}

export function useCreateRequest() {
  const { bookingId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExperienceRequestDto) =>
      requestsApi.create(bookingId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', bookingId] });
    },
  });
}
