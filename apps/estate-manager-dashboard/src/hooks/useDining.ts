import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emDiningApi } from '@/lib/api/dining';

export function useDining(bookingId: string | null) {
  return useQuery({
    queryKey: ['dining', bookingId],
    queryFn: () => emDiningApi.byBooking(bookingId!),
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}

/** Everything awaiting confirmation, across every booking. */
export function useDiningQueue() {
  return useQuery({
    queryKey: ['dining-queue'],
    queryFn: emDiningApi.queue,
    staleTime: 30_000,
  });
}

/**
 * Confirm / cancel invalidate the queue as well as the booking's own list,
 * since the same request appears in both places.
 */
export function useConfirmDining(bookingId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emDiningApi.confirm(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dining', bookingId] });
      void qc.invalidateQueries({ queryKey: ['dining-queue'] });
    },
  });
}

export function useCancelDining(bookingId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emDiningApi.cancel(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dining', bookingId] });
      void qc.invalidateQueries({ queryKey: ['dining-queue'] });
    },
  });
}
