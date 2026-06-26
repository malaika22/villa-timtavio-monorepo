import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diningApi } from '@/lib/api/dining';
import { catalogApi } from '@/lib/api/catalog';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';
import type { CreateDiningRequestDto } from '@repo/api-types';

function useBookingId(): string | null {
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const { bookingId: authBookingId } = useAuth();
  return storeBookingId ?? authBookingId;
}

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: catalogApi.menus,
    staleTime: 60_000,
  });
}

export function useDiningRequests() {
  const bookingId = useBookingId();
  return useQuery({
    queryKey: ['dining', bookingId],
    queryFn: () => diningApi.byBooking(bookingId!),
    enabled: !!bookingId,
  });
}

export function useCreateDiningRequest() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDiningRequestDto) => {
      if (!bookingId) {
        throw new Error('No active booking found. Please reopen the app.');
      }
      return diningApi.create(bookingId, dto);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dining', bookingId] });
    },
  });
}
