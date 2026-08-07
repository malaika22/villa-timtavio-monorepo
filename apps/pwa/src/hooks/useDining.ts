import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diningApi } from '@/lib/api/dining';
import { catalogApi } from '@/lib/api/catalog';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';
import type {
  CreateDiningRequestDto,
  AddLateArrivalDto,
  UpsertMenuSelectionDto,
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
 * The stay day by day — what the party has chosen, and what's still open.
 *
 * Fetched for the whole stay rather than a day at a time: guests have the app
 * weeks before arrival and plan the days ahead, and a stay is at most a couple
 * of dozen meals. Whether a day is still theirs to change is decided by the
 * API, not here — three implementations of one deadline is three chances to
 * disagree about it.
 */
export function useMenuPlan() {
  const bookingId = useBookingId();
  return useQuery({
    queryKey: ['menu-plan', bookingId],
    queryFn: () => diningApi.menuPlan(bookingId!),
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}

/** Compose one meal. The dish list sent is the whole meal, not a delta. */
export function useComposeMeal() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpsertMenuSelectionDto) => {
      if (!bookingId) {
        throw new Error('No active booking found. Please reopen the app.');
      }
      return diningApi.composeMeal(bookingId, dto);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['menu-plan', bookingId] });
    },
  });
}

/**
 * Chargeable additions a secondary asked for, awaiting the primary.
 *
 * Only the primary is ever shown these — they carry the folio, so the decision
 * is theirs and nobody else's to see.
 */
export function usePendingDiningApprovals() {
  const bookingId = useBookingId();
  const { isPrimary } = useAuth();
  return useQuery({
    queryKey: ['dining-approvals', bookingId],
    queryFn: () => diningApi.pendingApprovals(bookingId!),
    enabled: !!bookingId && isPrimary,
    staleTime: 15_000,
  });
}

export function useApproveDining() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      approve ? diningApi.approve(id) : diningApi.decline(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dining-approvals', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['dining', bookingId] });
    },
  });
}

/** When each meal is served, what may be chosen, and when a day closes. */
export function useDiningRules() {
  return useQuery({
    queryKey: ['dining-rules'],
    queryFn: diningApi.rules,
    staleTime: 5 * 60_000,
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
