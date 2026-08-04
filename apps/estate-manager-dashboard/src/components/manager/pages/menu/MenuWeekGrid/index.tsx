'use client';

import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import type { DailyMenu, MenuCategory } from '@repo/api-types';

import {
  useCopyDailyMenus,
  useDailyMenuWeek,
} from '@/hooks/useDailyMenus';
import { MenuServiceEditor } from '@/components/manager/pages/menu/MenuServiceEditor';

const PLANNED: MenuCategory[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

/** ISO date only. The API keys services by day, not instant. */
const key = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * A week of services, seven days across and three meals down.
 *
 * The week is the unit of work because the kitchen plans a week or more ahead —
 * a day-at-a-time editor would mean seven trips to plan what the chef decided
 * in one sitting.
 *
 * Draft cells are invisible to guests until published, so the grid has to show
 * that state plainly: a menu that looks planned but isn't published is the one
 * failure mode that reaches a guest as an empty screen.
 */
export const MenuWeekGrid = () => {
  // Monday-led: kitchens plan in weeks, and a week that starts on Sunday reads
  // wrong to everyone who works in one.
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [editing, setEditing] = useState<{
    date: string;
    mealType: MenuCategory;
  } | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const from = key(weekStart);
  const to = key(addDays(weekStart, 6));

  const { data: menus = [], isLoading } = useDailyMenuWeek(from, to);
  const copy = useCopyDailyMenus();

  const lookup = useMemo(() => {
    const map = new Map<string, DailyMenu>();
    for (const menu of menus) {
      map.set(`${menu.date.slice(0, 10)}:${menu.mealType}`, menu);
    }
    return map;
  }, [menus]);

  const today = key(new Date());

  const copyLastWeek = () => {
    copy.mutate(
      {
        fromStart: key(addDays(weekStart, -7)),
        toStart: from,
        days: 7,
      },
      {
        onSuccess: (result) =>
          toast.success(
            `${result.copied} service${result.copied === 1 ? '' : 's'} copied`,
            {
              description:
                result.skipped > 0
                  ? `${result.skipped} left alone — already published.`
                  : 'Copied as drafts. Publish when you’re happy with them.',
            },
          ),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-manager-border bg-manager-card px-3 py-2.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous week"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="size-8 border-manager-border bg-manager-card"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-manager-text">
          {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next week"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="size-8 border-manager-border bg-manager-card"
        >
          <ChevronRight className="size-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="ml-1 border-manager-border bg-manager-card text-manager-text"
        >
          This week
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={copyLastWeek}
          disabled={copy.isPending}
          className="ml-auto border-manager-border bg-manager-card text-manager-text"
        >
          {copy.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : null}
          Copy from last week
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-manager-border bg-manager-card">
        <div className="overflow-x-auto">
          <div className="min-w-[56rem]">
            <div className="grid grid-cols-[5.5rem_repeat(7,1fr)]">
              <div className="border-b border-manager-border bg-[#f7f5f2]" />
              {days.map((day) => (
                <div
                  key={key(day)}
                  className="border-b border-manager-border bg-[#f7f5f2] px-2 py-2 text-center"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-manager-text-muted">
                    {format(day, 'EEE')}
                  </p>
                  <p
                    className={cn(
                      'text-sm tabular-nums',
                      key(day) === today
                        ? 'font-bold text-manager-accent'
                        : 'text-manager-text',
                    )}
                  >
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {PLANNED.map((meal) => (
              <div key={meal} className="grid grid-cols-[5.5rem_repeat(7,1fr)]">
                <div className="flex items-center border-r border-b border-manager-border bg-[#f7f5f2] px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-manager-text-muted">
                  {MEAL_LABEL[meal]}
                </div>

                {days.map((day) => {
                  const menu = lookup.get(`${key(day)}:${meal}`);
                  const published = !!menu?.publishedAt;
                  const dishes = menu?.items ?? [];

                  return (
                    <button
                      key={`${key(day)}:${meal}`}
                      type="button"
                      onClick={() =>
                        setEditing({ date: key(day), mealType: meal })
                      }
                      className={cn(
                        'flex min-h-[5.5rem] flex-col gap-1 border-r border-b border-manager-border p-2 text-left last:border-r-0 hover:bg-[#faf9f7]',
                        isLoading && 'opacity-60',
                      )}
                    >
                      {menu ? (
                        <>
                          <span
                            className={cn(
                              'self-start rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                              published
                                ? 'bg-[#e9f2ea] text-[#3f6b45]'
                                : 'bg-[#f7f0e2] text-[#8a6d3b]',
                            )}
                          >
                            {published ? 'Published' : 'Draft'}
                          </span>
                          {dishes.slice(0, 2).map((item) => (
                            <span
                              key={item.id}
                              className="line-clamp-1 text-[11px] text-manager-text"
                            >
                              {item.menuItem.name}
                            </span>
                          ))}
                          {dishes.length > 2 && (
                            <span className="text-[10px] text-manager-text-muted">
                              +{dishes.length - 2} more
                            </span>
                          )}
                          {dishes.length === 0 && (
                            <span className="text-[10px] text-manager-text-muted">
                              No dishes yet
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="m-auto rounded border border-dashed border-manager-border px-2 py-0.5 text-[11px] text-manager-text-muted">
                          + Plan
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-manager-text-muted">
        Guests only see published services. An empty cell shows them “your chef
        is still planning this one”.
      </p>

      {editing && (
        <MenuServiceEditor
          date={editing.date}
          mealType={editing.mealType}
          menu={lookup.get(`${editing.date}:${editing.mealType}`)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};
