import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyMenuApi } from '@/lib/api/daily-menus';
import type { CopyDailyMenuDto, UpsertDailyMenuDto } from '@repo/api-types';

/** Every service in the week, drafts included — this is the planning view. */
export function useDailyMenuWeek(from: string, to: string) {
  return useQuery({
    queryKey: ['daily-menus', from, to],
    queryFn: () => dailyMenuApi.range(from, to),
    staleTime: 15_000,
  });
}

/**
 * Days in the near future with nothing published.
 *
 * Worth its own query: an unplanned week is a silent failure, where guests see
 * less than they did before daily menus existed and nothing says so.
 */
export function useDailyMenuGaps(withinDays = 7) {
  return useQuery({
    queryKey: ['daily-menu-gaps', withinDays],
    queryFn: () => dailyMenuApi.gaps(withinDays),
    staleTime: 60_000,
  });
}

/** Every write invalidates the whole feature — the grid and the gap warning. */
function useMenuMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-menus'] });
      void qc.invalidateQueries({ queryKey: ['daily-menu-gaps'] });
    },
  });
}

export function useUpsertDailyMenu() {
  return useMenuMutation((dto: UpsertDailyMenuDto) => dailyMenuApi.upsert(dto));
}

export function usePublishDailyMenu() {
  return useMenuMutation((id: string) => dailyMenuApi.publish(id));
}

export function useUnpublishDailyMenu() {
  return useMenuMutation((id: string) => dailyMenuApi.unpublish(id));
}

export function useDeleteDailyMenu() {
  return useMenuMutation((id: string) => dailyMenuApi.remove(id));
}

export function useCopyDailyMenus() {
  return useMenuMutation((dto: CopyDailyMenuDto) => dailyMenuApi.copy(dto));
}
