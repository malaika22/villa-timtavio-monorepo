import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emBookingsApi } from '@/lib/api/bookings';
import type { UpdateBookingStatusDto } from '@repo/api-types';

export function useCurrentActiveBooking() {
  return useQuery({
    queryKey: ['bookings', 'current-active'],
    queryFn: emBookingsApi.currentActive,
    staleTime: 30_000,
  });
}

/**
 * A booking the EM picked, rather than the one the API chose for them.
 *
 * Falls back to current-active when nothing is selected, so the page opens on
 * the next arrival exactly as before.
 */
export function useBookingForEm(bookingId: string | null) {
  const fallback = useCurrentActiveBooking();
  const selected = useQuery({
    queryKey: ['bookings', 'em', bookingId],
    queryFn: () => emBookingsApi.byId(bookingId!),
    enabled: !!bookingId,
    staleTime: 30_000,
  });
  return bookingId ? selected : fallback;
}

export function useApproveManifest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => emBookingsApi.approveManifest(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      dto,
    }: {
      bookingId: string;
      dto: UpdateBookingStatusDto;
    }) => emBookingsApi.updateStatus(bookingId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
