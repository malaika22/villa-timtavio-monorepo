import { useQuery } from '@tanstack/react-query';
import { guestsApi } from '@/lib/api/guests';
import { mapGuestToUpcomingStay } from '@/lib/mappers/guest';

export function useCurrentGuests() {
  return useQuery({
    queryKey: ['guests', 'current'],
    queryFn: guestsApi.getCurrent,
    select: (data) => data.map(mapGuestToUpcomingStay),
    staleTime: 60_000,
  });
}

export function useUpcomingGuests() {
  return useQuery({
    queryKey: ['guests', 'upcoming'],
    queryFn: guestsApi.getUpcoming,
    select: (data) => data.map(mapGuestToUpcomingStay),
    staleTime: 60_000,
  });
}

export function usePastGuests() {
  return useQuery({
    queryKey: ['guests', 'past'],
    queryFn: guestsApi.getPast,
    staleTime: 60_000,
  });
}
