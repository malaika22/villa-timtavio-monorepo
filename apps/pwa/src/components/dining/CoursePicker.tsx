'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import type { MenuCourse, MenuItem } from '@repo/api-types';
import { COURSE_LABELS } from '@repo/api-types';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';
import { cn } from '@repo/ui/lib/utils';

import { DishThumb } from './DishThumb';

type Filter = 'ALL' | 'VEGETARIAN' | 'NO_SHELLFISH' | 'NO_NUTS';

const FILTERS: { key: Filter; label: string; test: (d: MenuItem) => boolean }[] = [
  { key: 'ALL', label: 'Everything', test: () => true },
  { key: 'VEGETARIAN', label: 'Vegetarian', test: (d) => !!d.isVegetarian },
  { key: 'NO_SHELLFISH', label: 'No shellfish', test: (d) => !d.containsShellfish },
  { key: 'NO_NUTS', label: 'No nuts', test: (d) => !d.containsNuts },
];

/**
 * One course, full screen, opened deliberately.
 *
 * The composer used to show every course of every meal at once — a middle day
 * was sixty-eight rows stacked before you reached the snacks, with no room for
 * the description that makes a dish choosable. Nobody scrolls that to compare
 * two starters, so they picked the three they recognised and the kitchen's best
 * work went uncooked.
 *
 * Here the seventeen-dish lunch stops being a problem: it is the only thing on
 * screen, and there is room for the words.
 */
export const CoursePicker = ({
  open,
  onClose,
  course,
  dishes,
  limit,
  picked,
  onToggle,
  onDone,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  course: MenuCourse | null;
  /** Every dish on this course, in menu order. */
  dishes: MenuItem[];
  limit: number;
  picked: string[];
  onToggle: (dish: MenuItem) => void;
  onDone: () => void;
  saving?: boolean;
}) => {
  const [filter, setFilter] = useState<Filter>('ALL');

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0]!;
  const visible = useMemo(
    // A dish already chosen never disappears behind a filter — watching your
    // own choice vanish reads as having lost it.
    () => dishes.filter((d) => active.test(d) || picked.includes(d.id)),
    [dishes, active, picked],
  );

  const count = picked.filter((id) => dishes.some((d) => d.id === id)).length;
  const full = count >= limit;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="flex h-[100dvh] w-full flex-col border-0 bg-white p-0 data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:rounded-none">
        <DrawerTitle className="sr-only">
          {course ? COURSE_LABELS[course] : 'Choose a dish'}
        </DrawerTitle>

        <div className="flex shrink-0 items-center gap-3 border-b border-[#E3E0DA] px-4 pb-3 pt-4">
          <button onClick={onClose} className="text-[#2B2824]" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
          <p className="flex-1 text-[10px] font-medium uppercase tracking-[2.4px] text-[#2B2824]">
            {course ? COURSE_LABELS[course] : ''}
          </p>
          {/* In the header, where it can't scroll away. */}
          <span
            className={cn(
              'shrink-0 text-[12px] tabular-nums',
              full ? 'font-semibold text-[#3A5E48]' : 'text-[#797168]',
            )}
          >
            {count} / {limit}
          </span>
        </div>

        {dishes.length > 6 && (
          <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-b border-[#F0EDE6] px-4 py-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] transition-colors',
                  filter === f.key
                    ? 'border-[#0F1F2E] bg-[#0F1F2E] text-white'
                    : 'border-[#E3E0DA] bg-white text-[#797168]',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto" data-vaul-no-drag>
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-[11.5px] text-[#797168]">
              Nothing on this course is {active.label.toLowerCase()}.
            </p>
          ) : (
            <ul>
              {visible.map((dish) => {
                const on = picked.includes(dish.id);
                // At an allowance of one the obvious gesture is "I'd rather
                // have that one", so tapping another swaps. Above one, a full
                // course dims rather than hides — a guest should still see what
                // they gave up.
                const blocked = !on && full && limit !== 1;
                return (
                  <li key={dish.id}>
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => onToggle(dish)}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-[#F0EDE6] px-4 py-3 text-left',
                        on && 'bg-[#FBF8F1]',
                        blocked && 'opacity-40',
                      )}
                    >
                      <DishThumb
                        photoUrl={dish.photoUrl}
                        name={dish.name}
                        className="!size-14 !rounded-[10px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-snug text-[#2B2824]">
                          {dish.name}
                        </span>
                        {dish.description && (
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-[#797168]">
                            {dish.description}
                          </span>
                        )}
                        {(dish.containsNuts ||
                          dish.containsShellfish ||
                          dish.containsDairy) && (
                          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.6px] text-[#9A4A38]">
                            {[
                              dish.containsNuts && 'Nuts',
                              dish.containsShellfish && 'Shellfish',
                              dish.containsDairy && 'Dairy',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 flex size-[19px] shrink-0 items-center justify-center rounded-[6px] border',
                          on
                            ? 'border-[#0F1F2E] bg-[#0F1F2E] text-[#F2E7D2]'
                            : 'border-[#D8D3C9]',
                        )}
                        aria-hidden
                      >
                        {on && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-[#E3E0DA] bg-white px-4 py-3">
          <button
            type="button"
            onClick={onDone}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0F1F2E] py-3.5 text-[10px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            {saving ? 'Saving…' : `Done · ${count} of ${limit}`}
          </button>
          {!full && (
            <p className="mt-1.5 text-center text-[10px] text-[#9A9288]">
              {limit - count} more if you&rsquo;d like
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
