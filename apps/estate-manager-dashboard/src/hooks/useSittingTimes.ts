import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { emDiningApi } from '@/lib/api/dining';
import type { SittingTimes } from '@repo/api-types';

export function useSittingTimes() {
  return useQuery({
    queryKey: ['sitting-times'],
    queryFn: emDiningApi.getSittingTimes,
    staleTime: 60_000,
  });
}

export function useUpdateSittingTimes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SittingTimes) => emDiningApi.updateSittingTimes(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sitting-times'] });
      toast.success('Sitting times saved');
    },
    onError: (e) => toast.error((e as Error).message),
  });
}
