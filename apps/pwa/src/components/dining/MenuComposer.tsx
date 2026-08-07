'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Clock, Loader2, Lock } from 'lucide-react';
import type {
  MealType,
  MenuCourse,
  MenuItem,
  MenuPlanDay,
  MenuPlanMeal,
  MenuRules,
  DiningRequest,
} from '@repo/api-types';
import { COURSE_LABELS } from '@repo/api-types';
import { cn } from '@repo/ui/lib/utils';

import { useComposeMeal } from '@/hooks/useDining';
import { DishThumb } from './DishThumb';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

/**
 * What the party is eating, day by day — and, until the day closes, what they'd
 * like to be.
 *
 * The estate used to compose every day and the guest only read the result,
 * which is the wrong way round for a villa cooking for one party at a time.
 * The whole menu is now the pool and the primary member picks within the
 * allowances the estate set, up to the cutoff.
 */
export const MenuComposer = ({
  days,
  rules,
  dishes,
  canCompose,
  sittings = [],
  onFlagLate,
  flaggedLate,
}: {
  days: MenuPlanDay[];
  rules: MenuRules;
  /** The estate's whole menu. Grouped by course here, not by the caller. */
  dishes: MenuItem[];
  /** Only the primary composes — the estate cooks one menu for the party. */
  canCompose: boolean;
  sittings?: DiningRequest[];
  onFlagLate?: (sitting: DiningRequest) => void;
  flaggedLate?: (sitting: DiningRequest) => boolean;
}) => {
  const byCourse = useMemo(() => {
    const map = new Map<MenuCourse, MenuItem[]>();
    for (const dish of dishes) {
      if (!dish.course) continue;
      map.set(dish.course, [...(map.get(dish.course) ?? []), dish]);
    }
    return map;
  }, [dishes]);

  // Open on the first day still worth deciding — an in-stay guest lands on
  // today, and someone planning from home lands on the first day they can
  // still change rather than on an arrival day that has already closed.
  const [selected, setSelected] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      days.find((d) => d.date === today && !d.isLocked)?.date ??
      days.find((d) => !d.isLocked)?.date ??
      days[days.length - 1]?.date ??
      today
    );
  });

  if (days.length === 0) return null;
  const day = days.find((d) => d.date === selected) ?? days[0]!;

  const sittingFor = (mealType: MealType) =>
    sittings.find(
      (r) => r.mealType === mealType && (r.date ?? '').slice(0, 10) === day.date,
    );

  return (
    <section className="mb-6">
      <p className="mb-2 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
        Your menu
      </p>

      <div className="no-scrollbar -mx-3 mb-3 flex gap-1.5 overflow-x-auto px-3 pb-1">
        {days.map((d) => {
          const isOn = d.date === selected;
          const decided = d.meals.every((m) => (m.selection?.items.length ?? 0) > 0);
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelected(d.date)}
              aria-pressed={isOn}
              className={cn(
                'flex w-[42px] shrink-0 flex-col items-center rounded-[9px] border px-1 py-1.5',
                isOn
                  ? 'border-[#0F1F2E] bg-[#0F1F2E]'
                  : 'border-[#E3E0DA] bg-white',
              )}
            >
              <span
                className={cn(
                  'text-[7.5px] uppercase tracking-[0.7px]',
                  isOn ? 'text-[#B9A98C]' : 'text-[#9A9288]',
                )}
              >
                {format(parseISO(d.date), 'EEE')}
              </span>
              <span
                className={cn(
                  'mt-0.5 text-[12px] tabular-nums',
                  isOn ? 'text-[#F2E7D2]' : 'text-[#2B2824]',
                )}
              >
                {format(parseISO(d.date), 'd')}
              </span>
              {/* Decided · still yours · with the kitchen. Nothing shouts. */}
              <span
                className={cn(
                  'mt-1 block size-[3px] rounded-full',
                  d.isLocked
                    ? 'bg-[#C9C4BC]'
                    : decided
                      ? 'bg-[#3A5E48]'
                      : 'bg-[#B08D57]',
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <DayBanner day={day} canCompose={canCompose} />

      <div className="mt-3 flex flex-col gap-3">
        {day.meals.map((meal) => (
          <MealCard
            key={`${day.date}:${meal.mealType}`}
            date={day.date}
            meal={meal}
            rules={rules}
            byCourse={byCourse}
            editable={canCompose && !day.isLocked}
            sitting={sittingFor(meal.mealType)}
            onFlagLate={onFlagLate}
            flaggedLate={flaggedLate}
          />
        ))}
      </div>
    </section>
  );
};

function DayBanner({
  day,
  canCompose,
}: {
  day: MenuPlanDay;
  canCompose: boolean;
}) {
  if (day.isLocked) {
    return (
      <div className="flex items-start gap-2 rounded-[10px] bg-[#F1EEE8] px-3 py-2.5 text-[10px] leading-relaxed text-[#797168]">
        <Lock className="mt-px size-3 shrink-0" aria-hidden />
        <span>
          {format(parseISO(day.date), 'EEEE')} is with the kitchen now. Your
          concierge can still change it for you.
        </span>
      </div>
    );
  }

  if (!canCompose) {
    return (
      <div className="rounded-[10px] bg-[#F1EEE8] px-3 py-2.5 text-[10px] leading-relaxed text-[#797168]">
        The primary member composes the menu for the party.
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-[10px] bg-[#FBF3DF] px-3 py-2.5 text-[10px] leading-relaxed text-[#8A6D3B]">
      <Clock className="mt-px size-3 shrink-0" aria-hidden />
      <span>
        Yours to change until{' '}
        {format(new Date(day.closesAt), 'EEEE d MMM, HH:mm')}. Anything left
        unchosen, the chef decides.
      </span>
    </div>
  );
}

function MealCard({
  date,
  meal,
  rules,
  byCourse,
  editable,
  sitting,
  onFlagLate,
  flaggedLate,
}: {
  date: string;
  meal: MenuPlanMeal;
  rules: MenuRules;
  byCourse: Map<MenuCourse, MenuItem[]>;
  editable: boolean;
  sitting?: DiningRequest;
  onFlagLate?: (sitting: DiningRequest) => void;
  flaggedLate?: (sitting: DiningRequest) => boolean;
}) {
  const compose = useComposeMeal();

  const saved = useMemo(
    () => (meal.selection?.items ?? []).map((i) => i.menuItemId),
    [meal.selection],
  );
  const [picked, setPicked] = useState<string[]>(saved);
  const [note, setNote] = useState(meal.selection?.note ?? '');

  // A save elsewhere — or the estate amending after the cutoff — has to land
  // here, or the guest edits a copy of a meal that no longer exists.
  useEffect(() => {
    setPicked(saved);
    setNote(meal.selection?.note ?? '');
  }, [saved, meal.selection?.note]);

  const dirty =
    picked.length !== saved.length ||
    picked.some((id) => !saved.includes(id)) ||
    (note.trim() || '') !== (meal.selection?.note ?? '');

  const countFor = (course: MenuCourse) =>
    picked.filter((id) =>
      (byCourse.get(course) ?? []).some((d) => d.id === id),
    ).length;

  const toggle = (dish: MenuItem, course: MenuCourse) =>
    setPicked((prev) => {
      if (prev.includes(dish.id)) return prev.filter((id) => id !== dish.id);
      const limit = rules.courseLimits[course] ?? 1;
      const current = prev.filter((id) =>
        (byCourse.get(course) ?? []).some((d) => d.id === id),
      );
      // At one-per-course the obvious gesture is "I'd rather have that one",
      // so a second tap replaces instead of refusing. Above one, refuse — the
      // guest is at their allowance and should be told, not silently reshuffled.
      if (current.length >= limit) {
        if (limit !== 1) return prev;
        return [...prev.filter((id) => id !== current[0]), dish.id];
      }
      return [...prev, dish.id];
    });

  const save = () =>
    compose.mutate({
      date,
      mealType: meal.mealType,
      menuItemIds: picked,
      note: note.trim() || undefined,
    });

  const late = sitting && (flaggedLate?.(sitting) ?? false);

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E3E0DA] bg-white">
      <div className="flex items-baseline justify-between gap-2 border-b border-[#E3E0DA] bg-[#F7F5F2] px-3.5 py-2">
        <p className="font-cormorant text-[14px] text-[#2B2824]">
          {MEAL_LABEL[meal.mealType] ?? meal.mealType}
        </p>
        <p className="text-[9.5px] tabular-nums text-[#797168]">
          {sitting?.time
            ? `Table at ${sitting.time}`
            : `Served ${meal.window.start}–${meal.window.end}`}
        </p>
      </div>

      {sitting && (
        <div className="flex items-center justify-between gap-2 border-b border-[#F0EDE6] bg-[#FBF3DF] px-3.5 py-2">
          <span className="text-[9.5px] text-[#8A6D3B]">
            {late
              ? 'You’ll be arriving late'
              : `Your table is set for ${sitting.time ?? 'this service'}`}
          </span>
          {onFlagLate && !late && (
            <button
              type="button"
              onClick={() => onFlagLate(sitting)}
              className="flex shrink-0 items-center gap-1 rounded-full border border-[#8A6D3B] px-2 py-0.5 text-[9px] text-[#8A6D3B]"
            >
              <Clock className="size-2.5" aria-hidden />
              I’ll be late
            </button>
          )}
          {late && (
            <Check className="size-3 shrink-0 text-[#3A5E48]" aria-hidden />
          )}
        </div>
      )}

      {meal.courses.map((course) => {
        const options = byCourse.get(course) ?? [];
        if (options.length === 0) return null;
        const limit = rules.courseLimits[course] ?? 1;
        const count = countFor(course);
        const full = count >= limit;

        // Once a day is closed there's nothing to browse — showing eleven
        // breakfast dishes to someone who can only read them is noise.
        const visible = editable
          ? options
          : options.filter((d) => picked.includes(d.id));
        if (!editable && visible.length === 0) return null;

        return (
          <div key={course}>
            <div className="flex items-baseline justify-between gap-2 border-b border-[#F0EDE6] px-3.5 py-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-[1.6px] text-[#9A9288]">
                {COURSE_LABELS[course]}
              </p>
              {editable && (
                <p
                  className={cn(
                    'text-[9px] tabular-nums',
                    full ? 'font-semibold text-[#3A5E48]' : 'text-[#797168]',
                  )}
                >
                  {count} of {limit}
                </p>
              )}
            </div>
            <ul>
              {visible.map((dish) => {
                const on = picked.includes(dish.id);
                // At an allowance of one, tapping another swaps. Above one, a
                // full course genuinely can't take more.
                const blocked = editable && !on && full && limit !== 1;
                return (
                  <li key={dish.id}>
                    <button
                      type="button"
                      disabled={!editable || blocked}
                      onClick={() => toggle(dish, course)}
                      className={cn(
                        'flex w-full items-center gap-2.5 border-b border-[#F0EDE6] px-3.5 py-2 text-left last:border-b-0',
                        blocked && 'opacity-40',
                      )}
                    >
                      {editable && (
                        <span
                          className={cn(
                            'flex size-[17px] shrink-0 items-center justify-center rounded-[5px] border',
                            on
                              ? 'border-[#0F1F2E] bg-[#0F1F2E] text-[#F2E7D2]'
                              : 'border-[#D8D3C9]',
                          )}
                          aria-hidden
                        >
                          {on && <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                      )}
                      <DishThumb
                        photoUrl={dish.photoUrl}
                        name={dish.name}
                        className="!size-9 !rounded-[7px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] leading-snug text-[#2B2824]">
                          {dish.name}
                        </span>
                        {(dish.containsNuts || dish.containsShellfish) && (
                          <span className="mt-0.5 block text-[8.5px] uppercase tracking-[0.6px] text-[#9A4A38]">
                            {[
                              dish.containsNuts && 'Nuts',
                              dish.containsShellfish && 'Shellfish',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {picked.length === 0 && !editable && (
        <p className="px-3.5 py-3 text-[10.5px] leading-relaxed text-[#797168]">
          Nothing was chosen, so the chef is cooking their own{' '}
          {(MEAL_LABEL[meal.mealType] ?? meal.mealType).toLowerCase()}.
        </p>
      )}

      {editable ? (
        <div className="border-t border-[#F0EDE6] px-3.5 py-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Anything the kitchen should know? e.g. we’re out on the boat until one"
            className="w-full resize-none rounded-[10px] border border-[#E3E0DA] bg-white px-3 py-2 text-[11.5px] outline-none placeholder:text-[#B0AAA0]"
          />

          {compose.isError && (
            <p className="mt-2 text-[10.5px] text-[#9A4A38]">
              {(compose.error as Error).message}
            </p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={!dirty || compose.isPending}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0F1F2E] py-2.5 text-[10px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-40"
          >
            {compose.isPending && (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            )}
            {dirty
              ? `Save ${(MEAL_LABEL[meal.mealType] ?? '').toLowerCase()}`
              : 'Saved'}
          </button>
        </div>
      ) : (
        note.trim() && (
          <p className="border-t border-[#F0EDE6] bg-[#FBF3DF] px-3.5 py-2 text-[10px] italic leading-snug text-[#8A6D3B]">
            {note}
          </p>
        )
      )}
    </div>
  );
}
