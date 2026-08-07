import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { emDiningApi } from '@/lib/api/dining';
import type { DiningRules, UpsertMenuSelectionDto } from '@repo/api-types';

/** Service windows, per-course allowances and how far ahead a day closes. */
export function useDiningRules() {
  return useQuery({
    queryKey: ['dining-rules'],
    queryFn: emDiningApi.getRules,
    staleTime: 60_000,
  });
}

export function useUpdateDiningRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<DiningRules>) => emDiningApi.updateRules(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dining-rules'] });
      void qc.invalidateQueries({ queryKey: ['kitchen-sheet'] });
      toast.success('Service rules saved');
    },
    onError: (e) => toast.error((e as Error).message),
  });
}

/** Every meal the estate is cooking between two dates. */
export function useKitchenSheet(from: string, to: string) {
  return useQuery({
    queryKey: ['kitchen-sheet', from, to],
    queryFn: () => emDiningApi.kitchen(from, to),
    enabled: !!from && !!to,
    staleTime: 15_000,
  });
}

/**
 * Change a meal on the party's behalf.
 *
 * The one thing the estate can do that the guest can't: amend a day after the
 * cutoff. A party that changes its mind still telephones — the difference is
 * that the change lands on the run sheet with a name against it.
 */
export function useAmendMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      dto,
    }: {
      bookingId: string;
      dto: UpsertMenuSelectionDto;
    }) => emDiningApi.amendMeal(bookingId, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['kitchen-sheet'] });
      toast.success('Menu updated — the kitchen sheet now shows the change');
    },
    onError: (e) => toast.error((e as Error).message),
  });
}
