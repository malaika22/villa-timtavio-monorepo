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

/**
 * The published menus across the guest's stay.
 *
 * Fetched for the whole stay rather than a day at a time: guests have the app
 * weeks before arrival and browse the days ahead, and a stay is at most a
 * couple of dozen services.
 */
export function useDailyMenus(from?: string | null, to?: string | null) {
  return useQuery({
    queryKey: ['daily-menus', from, to],
    queryFn: () => diningApi.dailyMenus(from!, to!),
    enabled: !!from && !!to,
    staleTime: 60_000,
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

/**
 * Drop a dining request.
 *
 * The endpoint always allowed this — the app simply never called it, so a guest
 * whose plans changed had to telephone the estate.
 */
export function useCancelDiningRequest() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diningApi.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dining', bookingId] });
    },
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
