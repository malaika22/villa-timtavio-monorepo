import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { emBrokerApi } from '@/lib/api/broker';

/**
 * Dates brokers are sitting on.
 *
 * Refetched on an interval because every row carries a countdown and the whole
 * point of the screen is that these expire. A queue that says "3h left" an hour
 * after you opened the tab is worse than no countdown at all.
 */
export function useBrokerHolds() {
  return useQuery({
    queryKey: ['broker-holds'],
    queryFn: emBrokerApi.holds,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useConfirmHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emBrokerApi.confirm(id),
    onSuccess: (hold) => {
      void qc.invalidateQueries({ queryKey: ['broker-holds'] });
      toast.success(`Confirmed for ${hold.brokerName}`, {
        description: 'Make the reservation in Lodgify — it syncs back here.',
      });
    },
    onError: (e) => toast.error((e as Error).message),
  });
}

export function useReleaseHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      emBrokerApi.release(id, note),
    onSuccess: (hold) => {
      void qc.invalidateQueries({ queryKey: ['broker-holds'] });
      toast.success(`Released — those nights are open again`, {
        description: `Let ${hold.brokerName} know.`,
      });
    },
    onError: (e) => toast.error((e as Error).message),
  });
}

/**
 * Clears out a hold nobody acted on.
 *
 * Confirmed holds are refused by the API — that row is the record of how a
 * booking came about, and the estate's answer if a broker ever says they held
 * dates that were given away.
 */
export function useDeleteHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emBrokerApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['broker-holds'] });
      toast.success('Hold removed');
    },
    onError: (e) => toast.error((e as Error).message),
  });
}
