import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diningApi } from '@/lib/api/dining';
import { catalogApi } from '@/lib/api/catalog';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';
import type {
  CreateDiningRequestDto,
  AddLateArrivalDto,
} from '@repo/api-types';

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

/** Estate-configured recommended sitting times per meal. */
export function useSittingTimes() {
  return useQuery({
    queryKey: ['sitting-times'],
    queryFn: diningApi.sittingTimes,
    staleTime: 60_000,
  });
}

/** Secondary guests flag a late arrival to the primary's sitting. */
export function useAddLateArrival() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AddLateArrivalDto }) =>
      diningApi.addLateArrival(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dining', bookingId] });
    },
  });
}
