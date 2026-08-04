'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/lib/api/guests';
import {
  mapGuestSummaryToListItem,
  mapGuestProfileToDNA,
} from '@/lib/mappers/guest';
import type { UpdateGuestDnaDto, GuestProfile } from '@repo/api-types';

export function useCurrentGuestsRaw() {
  return useQuery({
    queryKey: ['guests', 'current'],
    queryFn: guestsApi.getCurrent,
  });
}

export function useCurrentGuests() {
  return useQuery({
    queryKey: ['guests', 'current'],
    queryFn: guestsApi.getCurrent,
    select: (data) => data.map((g) => mapGuestSummaryToListItem(g)),
  });
}

export function useUpcomingGuests() {
  return useQuery({
    queryKey: ['guests', 'upcoming'],
    queryFn: guestsApi.getUpcoming,
  });
}

/**
 * Upcoming stays in the same shape as the current-guest list.
 *
 * The raw hook returns the planning-pipeline shape, which is right for the
 * bookings table but not for anywhere that treats current and upcoming stays
 * alike — such as the folio, where a booking accrues charges weeks before
 * anyone arrives.
 */
export function useUpcomingGuestsAsList() {
  return useQuery({
    queryKey: ['guests', 'upcoming'],
    queryFn: guestsApi.getUpcoming,
    select: (data) => data.map((g) => mapGuestSummaryToListItem(g)),
  });
}

export function usePastGuests(search?: string) {
  return useQuery({
    queryKey: ['guests', 'past', search],
    queryFn: () => guestsApi.getPast(search),
    select: (data) => data.map((g) => mapGuestSummaryToListItem(g, true)),
  });
}

export function useGuests(search: string) {
  const currentQuery = useCurrentGuests();
  const pastQuery = usePastGuests(search || undefined);

  return {
    current: currentQuery.data ?? [],
    past: pastQuery.data ?? [],
    loading: currentQuery.isLoading || pastQuery.isLoading,
    usingMock: false,
    refetch: () => {
      void currentQuery.refetch();
      void pastQuery.refetch();
    },
  };
}

export function useGuestProfile(guestId: string | null) {
  return useQuery({
    queryKey: ['guests', guestId, 'profile'],
    queryFn: () => guestsApi.getProfile(guestId!),
    enabled: !!guestId,
    select: mapGuestProfileToDNA,
  });
}

export function useUpdateGuestDna() {
  const queryClient = useQueryClient();
  return useMutation<
    GuestProfile,
    Error,
    { id: string; dto: UpdateGuestDnaDto }
  >({
    mutationFn: ({ id, dto }) => guestsApi.updateDna(id, dto),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: ['guests', id, 'profile'],
      });
    },
  });
}
