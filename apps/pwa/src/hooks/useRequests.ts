import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '@/lib/api/requests';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';
import type { CreateExperienceRequestDto } from '@repo/api-types';

/**
 * The booking store is the authoritative bookingId (populated by
 * useCurrentBooking); the JWT claim is often empty, so prefer the store.
 */
function useBookingId(): string | null {
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const { bookingId: authBookingId } = useAuth();
  return storeBookingId ?? authBookingId;
}

export function useBookingRequests() {
  const bookingId = useBookingId();
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
  const bookingId = useBookingId();
  return useQuery({
    queryKey: ['requests', bookingId, 'pending-approval'],
    queryFn: () => requestsApi.pendingApproval(bookingId!),
    enabled: !!bookingId,
  });
}

export function useCreateRequest() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExperienceRequestDto) => {
      if (!bookingId) {
        throw new Error('No active booking found. Please reopen the app.');
      }
      return requestsApi.create(bookingId, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', bookingId] });
    },
  });
}
