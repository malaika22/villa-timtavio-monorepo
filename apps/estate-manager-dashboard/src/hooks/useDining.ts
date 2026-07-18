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

export function useConfirmDining(bookingId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emDiningApi.confirm(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['dining', bookingId] }),
  });
}

export function useCancelDining(bookingId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emDiningApi.cancel(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['dining', bookingId] }),
  });
}
