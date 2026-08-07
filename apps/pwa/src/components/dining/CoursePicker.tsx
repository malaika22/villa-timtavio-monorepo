'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Info, Loader2 } from 'lucide-react';
import type { MenuCourse, MenuItem } from '@repo/api-types';
import { COURSE_LABELS } from '@repo/api-types';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';
import { cn } from '@repo/ui/lib/utils';

import { DishThumb } from './DishThumb';

/**
 * The filters worth offering, and when.
 *
 * The same six flags the estate sets on a dish, so a guest is filtering by
 * exactly what the kitchen recorded — nothing here is a separate vocabulary
 * that could drift from it.
 *
 * `relevant` is the other half: a "No shellfish" chip on a course with no
 * shellfish in it is a control that can only ever do nothing, and "Vegetarian"
 * is a dead end until the estate has actually flagged some dishes. Both were
 * showing regardless, which is how you tap Vegetarian and are shown a ceviche.
 */
const FILTERS = [
  {
    key: 'VEGETARIAN',
    label: 'Vegetarian',
    test: (d: MenuItem) => !!d.isVegetarian,
    relevant: (all: MenuItem[]) => all.some((d) => d.isVegetarian),
  },
  {
    key: 'VEGAN',
    label: 'Vegan',
    test: (d: MenuItem) => !!d.isVegan,
    relevant: (all: MenuItem[]) => all.some((d) => d.isVegan),
  },
  {
    key: 'GLUTEN_FREE',
    label: 'Gluten-free',
    test: (d: MenuItem) => !!d.isGlutenFree,
    relevant: (all: MenuItem[]) => all.some((d) => d.isGlutenFree),
  },
  // The estate marks a dish as *containing* something; a guest filters to
  // avoid it. Same three flags, read from the other side.
  {
    key: 'NO_NUTS',
    label: 'No nuts',
    test: (d: MenuItem) => !d.containsNuts,
    relevant: (all: MenuItem[]) => all.some((d) => d.containsNuts),
  },
  {
    key: 'NO_DAIRY',
    label: 'No dairy',
    test: (d: MenuItem) => !d.containsDairy,
    relevant: (all: MenuItem[]) => all.some((d) => d.containsDairy),
  },
  {
    key: 'NO_SHELLFISH',
    label: 'No shellfish',
    test: (d: MenuItem) => !d.containsShellfish,
    relevant: (all: MenuItem[]) => all.some((d) => d.containsShellfish),
  },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'] | 'ALL';

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
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [detail, setDetail] = useState<MenuItem | null>(null);

  const chips = useMemo(
    () => FILTERS.filter((f) => f.relevant(dishes)),
    [dishes],
  );
  const active = chips.find((f) => f.key === filter) ?? null;

  // Filters filter. Keeping chosen dishes visible regardless read as the
  // control being broken — you tapped Vegetarian and a shrimp aguachile stayed
  // on screen. They're counted instead, and named in a line you can act on.
  const visible = useMemo(
    () => (active ? dishes.filter((d) => active.test(d)) : dishes),
    [dishes, active],
  );
  const hiddenPicks = useMemo(
    () =>
      active
        ? dishes.filter((d) => picked.includes(d.id) && !active.test(d))
        : [],
    [dishes, active, picked],
  );

  const count = picked.filter((id) => dishes.some((d) => d.id === id)).length;
  const full = count >= limit;
  const remaining = limit - count;

  return (
    <>
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

          {chips.length > 0 && (
            <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-b border-[#F0EDE6] px-4 py-2">
              {[{ key: 'ALL' as const, label: 'Everything' }, ...chips].map(
                (f) => (
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
                ),
              )}
            </div>
          )}

          {hiddenPicks.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className="shrink-0 border-b border-[#F0EDE6] bg-[#FBF3DF] px-4 py-2 text-left text-[10.5px] leading-snug text-[#8A6D3B]"
            >
              {hiddenPicks.length === 1
                ? '1 dish you’ve chosen is hidden by this filter'
                : `${hiddenPicks.length} dishes you’ve chosen are hidden by this filter`}
              . <span className="underline">Show everything</span>
            </button>
          )}

          <div className="flex-1 overflow-y-auto" data-vaul-no-drag>
            {visible.length === 0 ? (
              <p className="px-5 py-10 text-center text-[11.5px] text-[#797168]">
                Nothing on this course matches.
              </p>
            ) : (
              <ul>
                {visible.map((dish) => {
                  const on = picked.includes(dish.id);
                  // At an allowance of one the obvious gesture is "I'd rather
                  // have that one", so tapping another swaps. Above one, a full
                  // course dims rather than hides — a guest should still see
                  // what they gave up.
                  const blocked = !on && full && limit !== 1;
                  return (
                    <li
                      key={dish.id}
                      className={cn(
                        'flex items-start gap-3 border-b border-[#F0EDE6] px-4 py-3',
                        on && 'bg-[#FBF8F1]',
                        blocked && 'opacity-40',
                      )}
                    >
                      {/* Its own control, so the photo can open the dish
                          without also choosing it. */}
                      <button
                        type="button"
                        onClick={() => setDetail(dish)}
                        aria-label={`About ${dish.name}`}
                        className="relative shrink-0"
                      >
                        <DishThumb
                          photoUrl={dish.photoUrl}
                          name={dish.name}
                          className="!size-14 !rounded-[10px]"
                        />
                        <span
                          className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border border-[#E3E0DA] bg-white text-[#8A6D3B]"
                          aria-hidden
                        >
                          <Info className="size-2.5" />
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={blocked}
                        onClick={() => onToggle(dish)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
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
            {remaining > 0 && (
              <p className="mt-1.5 text-center text-[10px] text-[#9A9288]">
                {`${remaining} more if you’d like`}
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <DishDetail
        dish={detail}
        chosen={!!detail && picked.includes(detail.id)}
        onToggle={() => {
          if (detail) onToggle(detail);
          setDetail(null);
        }}
        onClose={() => setDetail(null)}
      />
    </>
  );
};

/**
 * The dish itself.
 *
 * A list row can carry two lines of description before it stops being a list.
 * This is where a full one — and a photograph worth looking at — belongs, for
 * the guest deciding between two things they've never eaten.
 */
function DishDetail({
  dish,
  chosen,
  onToggle,
  onClose,
}: {
  dish: MenuItem | null;
  chosen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const flags: { label: string; warn: boolean }[] = [];
  if (dish?.isVegetarian) flags.push({ label: 'Vegetarian', warn: false });
  if (dish?.isVegan) flags.push({ label: 'Vegan', warn: false });
  if (dish?.isGlutenFree) flags.push({ label: 'Gluten free', warn: false });
  if (dish?.containsNuts) flags.push({ label: 'Contains nuts', warn: true });
  if (dish?.containsShellfish)
    flags.push({ label: 'Contains shellfish', warn: true });
  if (dish?.containsDairy) flags.push({ label: 'Contains dairy', warn: true });

  return (
    <Drawer open={!!dish} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="bg-white pb-7">
        <DrawerTitle className="sr-only">{dish?.name ?? 'Dish'}</DrawerTitle>
        {dish && (
          <div className="px-4 pt-1" data-vaul-no-drag>
            <DishThumb
              photoUrl={dish.photoUrl}
              name={dish.name}
              className="!h-40 !w-full !rounded-[12px]"
            />
            <p className="mt-3 font-cormorant text-[20px] leading-tight text-[#2B2824]">
              {dish.name}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#797168]">
              {dish.description ||
                'Your chef hasn’t written this one up yet — ask your concierge and they’ll tell you exactly what’s in it.'}
            </p>

            {flags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {flags.map((f) => (
                  <span
                    key={f.label}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px]',
                      f.warn
                        ? 'border-[#E4B7B2] bg-[#FBEEEA] text-[#9A4A38]'
                        : 'border-[#CBD9C7] bg-[#EFF4EC] text-[#3A5E48]',
                    )}
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            )}

            {dish.otherDietaryNotes && (
              <p className="mt-2 text-[11px] leading-snug text-[#797168]">
                {dish.otherDietaryNotes}
              </p>
            )}

            <button
              type="button"
              onClick={onToggle}
              className={cn(
                'mt-4 w-full rounded-[10px] py-3 text-[10px] font-semibold uppercase tracking-[2px]',
                chosen
                  ? 'border border-[#E3E0DA] text-[#797168]'
                  : 'bg-[#0F1F2E] text-white',
              )}
            >
              {chosen ? 'Take it off' : 'Add it'}
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
