'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Pencil,
} from 'lucide-react';
import type {
  DiningRequest,
  MealType,
  MenuCourse,
  MenuItem,
  MenuPlanDay,
  MenuPlanMeal,
  MenuRules,
} from '@repo/api-types';
import { COURSE_LABELS } from '@repo/api-types';
import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';
import { cn } from '@repo/ui/lib/utils';

import { useComposeMeal } from '@/hooks/useDining';
import { CoursePicker } from './CoursePicker';
// A menu day is a calendar date; closesAt just below is a real instant and
// deliberately still rendered in the reader's own time.
import {
  stayDayOfMonth,
  stayWeekdayLong,
  stayWeekdayShort,
} from '@/lib/stay-date';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

/** Which course of which meal a sheet is currently open on. */
type Target = { mealType: MealType; course: MenuCourse } | null;

/**
 * The party's day, on one screen.
 *
 * The first version put every dish of every course inline, so a middle day ran
 * to sixty-eight rows and the thing a primary member actually does most —
 * check what has already been decided — took a minute of scrolling. This is a
 * summary: one line per course, naming what's chosen or admitting it isn't.
 * Choosing happens in {@link CoursePicker}, where there is room to read.
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
  dishes: MenuItem[];
  canCompose: boolean;
  sittings?: DiningRequest[];
  onFlagLate?: (sitting: DiningRequest) => void;
  flaggedLate?: (sitting: DiningRequest) => boolean;
}) => {
  const compose = useComposeMeal();

  const byCourse = useMemo(() => {
    const map = new Map<MenuCourse, MenuItem[]>();
    for (const dish of dishes) {
      if (!dish.course) continue;
      map.set(dish.course, [...(map.get(dish.course) ?? []), dish]);
    }
    return map;
  }, [dishes]);

  // Open on the first day still worth deciding — an in-stay guest lands on
  // today, someone planning from home on the first day they can still change.
  const [selected, setSelected] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      days.find((d) => d.date === today && !d.isLocked)?.date ??
      days.find((d) => !d.isLocked)?.date ??
      days[days.length - 1]?.date ??
      today
    );
  });

  const [target, setTarget] = useState<Target>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [noteFor, setNoteFor] = useState<MealType | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  if (days.length === 0) return null;
  const day = days.find((d) => d.date === selected) ?? days[0]!;
  const editable = canCompose && !day.isLocked;

  const mealOf = (mealType: MealType) =>
    day.meals.find((m) => m.mealType === mealType);

  const chosenIds = (meal?: MenuPlanMeal) =>
    (meal?.selection?.items ?? []).map((i) => i.menuItemId);

  const sittingFor = (mealType: MealType) =>
    sittings.find(
      (r) =>
        r.mealType === mealType && (r.date ?? '').slice(0, 10) === day.date,
    );

  /** Everything on the meal, with one course swapped for the draft. */
  const merged = (meal: MenuPlanMeal, course: MenuCourse, next: string[]) => {
    const others = chosenIds(meal).filter(
      (id) => byCourse.get(course)?.every((d) => d.id !== id) ?? true,
    );
    return [...others, ...next];
  };

  const openPicker = (mealType: MealType, course: MenuCourse) => {
    const meal = mealOf(mealType);
    const options = byCourse.get(course) ?? [];
    setDraft(chosenIds(meal).filter((id) => options.some((d) => d.id === id)));
    setTarget({ mealType, course });
  };

  const toggleInDraft = (dish: MenuItem, course: MenuCourse) =>
    setDraft((prev) => {
      if (prev.includes(dish.id)) return prev.filter((id) => id !== dish.id);
      const limit = rules.courseLimits[course] ?? 1;
      if (prev.length >= limit) {
        if (limit !== 1) return prev;
        return [dish.id];
      }
      return [...prev, dish.id];
    });

  // Saving on Done rather than behind a separate button: a sheet you dismissed
  // should have kept what you chose in it.
  const saveCourse = () => {
    if (!target) return;
    const meal = mealOf(target.mealType);
    if (!meal) return;
    compose.mutate(
      {
        date: day.date,
        mealType: target.mealType,
        menuItemIds: merged(meal, target.course, draft),
        note: meal.selection?.note ?? undefined,
      },
      { onSuccess: () => setTarget(null) },
    );
  };

  const saveNote = () => {
    if (!noteFor) return;
    const meal = mealOf(noteFor);
    if (!meal) return;
    compose.mutate(
      {
        date: day.date,
        mealType: noteFor,
        menuItemIds: chosenIds(meal),
        note: noteDraft.trim() || undefined,
      },
      { onSuccess: () => setNoteFor(null) },
    );
  };

  return (
    <section className="mb-6">
      <p className="mb-2 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
        Your menu
      </p>

      <div className="no-scrollbar -mx-3 mb-3 flex gap-1.5 overflow-x-auto px-3 pb-1">
        {days.map((d) => {
          const isOn = d.date === selected;
          const decided = d.meals.every(
            (m) => (m.selection?.items.length ?? 0) > 0,
          );
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
                {stayWeekdayShort(d.date)}
              </span>
              <span
                className={cn(
                  'mt-0.5 text-[12px] tabular-nums',
                  isOn ? 'text-[#F2E7D2]' : 'text-[#2B2824]',
                )}
              >
                {stayDayOfMonth(d.date)}
              </span>
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

      {day.isLocked ? (
        <div className="flex items-start gap-2 rounded-[10px] bg-[#F1EEE8] px-3 py-2.5 text-[10px] leading-relaxed text-[#797168]">
          <Lock className="mt-px size-3 shrink-0" aria-hidden />
          <span>
            {stayWeekdayLong(day.date)} is with the kitchen now. Your concierge
            can still change it for you.
          </span>
        </div>
      ) : canCompose ? (
        <div className="flex items-start gap-2 rounded-[10px] bg-[#FBF3DF] px-3 py-2.5 text-[10px] leading-relaxed text-[#8A6D3B]">
          <Clock className="mt-px size-3 shrink-0" aria-hidden />
          <span>
            Yours to change until{' '}
            {format(new Date(day.closesAt), 'EEEE d MMM, HH:mm')}. Anything left
            unchosen, the chef decides.
          </span>
        </div>
      ) : (
        <div className="rounded-[10px] bg-[#F1EEE8] px-3 py-2.5 text-[10px] leading-relaxed text-[#797168]">
          The primary member composes the menu for the party.
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {day.meals.map((meal) => {
          const sitting = sittingFor(meal.mealType);
          const late = sitting && (flaggedLate?.(sitting) ?? false);
          const chosen = meal.selection?.items ?? [];

          return (
            <div
              key={meal.mealType}
              className="overflow-hidden rounded-[12px] border border-[#E3E0DA] bg-white"
            >
              <div className="flex items-baseline justify-between gap-2 border-b border-[#E3E0DA] bg-[#F7F5F2] px-3.5 py-2">
                <p className="font-cormorant text-[14px] text-[#2B2824]">
                  {MEAL_LABEL[meal.mealType] ?? meal.mealType}
                </p>
                <p className="text-[9.5px] tabular-nums text-[#797168]">
                  {sitting?.time
                    ? `Table ${sitting.time}`
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
                    <Check
                      className="size-3 shrink-0 text-[#3A5E48]"
                      aria-hidden
                    />
                  )}
                </div>
              )}

              {meal.courses.map((course) => {
                const options = byCourse.get(course) ?? [];
                const picked = chosen.filter((i) => i.course === course);
                const limit = rules.courseLimits[course] ?? 1;

                // On a closed day an empty course is silence, not an invitation.
                if (!editable && picked.length === 0) return null;

                const Row = editable ? 'button' : 'div';
                return (
                  <Row
                    key={course}
                    {...(editable
                      ? {
                          type: 'button' as const,
                          onClick: () => openPicker(meal.mealType, course),
                        }
                      : {})}
                    className="block w-full border-b border-[#F0EDE6] px-3.5 py-2.5 text-left last:border-b-0"
                  >
                    {/* Label above rather than beside. Squeezed into a narrow
                        left column, five dish names ran to five lines of grey
                        and read as a paragraph nobody wrote. */}
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[8.5px] uppercase tracking-[1.4px] text-[#9A9288]">
                        {COURSE_LABELS[course]}
                      </span>
                      {editable && (
                        <span className="flex shrink-0 items-center gap-1">
                          <span
                            className={cn(
                              'text-[9.5px] tabular-nums',
                              picked.length >= limit
                                ? 'font-semibold text-[#3A5E48]'
                                : 'text-[#B08D57]',
                            )}
                          >
                            {picked.length > 0
                              ? `${picked.length}/${limit}`
                              : 'Choose'}
                          </span>
                          <ChevronRight
                            className="size-3.5 text-[#B0AAA0]"
                            aria-hidden
                          />
                        </span>
                      )}
                    </span>

                    {picked.length === 0 ? (
                      <span className="mt-1 block text-[12px] italic text-[#9A9288]">
                        Nothing chosen yet
                      </span>
                    ) : (
                      <span className="mt-1 block">
                        {/* Two names, then a count. A summary that lists all
                            five isn't a summary. */}
                        {picked.slice(0, 2).map((i) => (
                          <span
                            key={i.id}
                            className="block text-[12px] leading-snug text-[#2B2824]"
                          >
                            {i.menuItem.name}
                          </span>
                        ))}
                        {picked.length > 2 && (
                          <span className="mt-0.5 block text-[10.5px] text-[#797168]">
                            and {picked.length - 2} more
                          </span>
                        )}
                      </span>
                    )}
                  </Row>
                );
              })}

              {editable ? (
                <button
                  type="button"
                  onClick={() => {
                    setNoteDraft(meal.selection?.note ?? '');
                    setNoteFor(meal.mealType);
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-[#F0EDE6] bg-[#FBFAF8] px-3.5 py-2.5 text-left"
                >
                  <Pencil
                    className="size-3 shrink-0 text-[#B08D57]"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 text-[11px] leading-snug">
                    {meal.selection?.note ? (
                      <span className="italic text-[#8A6D3B]">
                        “{meal.selection.note}”
                      </span>
                    ) : (
                      <span className="text-[#9A9288]">
                        A note for the kitchen
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className="size-3.5 shrink-0 text-[#B0AAA0]"
                    aria-hidden
                  />
                </button>
              ) : (
                meal.selection?.note && (
                  <p className="border-t border-[#F0EDE6] bg-[#FBF3DF] px-3.5 py-2 text-[10px] italic leading-snug text-[#8A6D3B]">
                    {meal.selection.note}
                  </p>
                )
              )}

              {!editable && chosen.length === 0 && (
                <p className="px-3.5 py-3 text-[10.5px] leading-relaxed text-[#797168]">
                  Nothing was chosen, so the chef is cooking their own{' '}
                  {(MEAL_LABEL[meal.mealType] ?? meal.mealType).toLowerCase()}.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {compose.isError && (
        <p className="mt-2 rounded-[10px] border border-[#E4B7B2] bg-[#FBEEEA] px-3 py-2 text-[11px] text-[#9A4A38]">
          {(compose.error as Error).message}
        </p>
      )}

      <CoursePicker
        open={!!target}
        onClose={() => setTarget(null)}
        course={target?.course ?? null}
        dishes={target ? (byCourse.get(target.course) ?? []) : []}
        limit={target ? (rules.courseLimits[target.course] ?? 1) : 1}
        picked={draft}
        onToggle={(dish) => target && toggleInDraft(dish, target.course)}
        onDone={saveCourse}
        saving={compose.isPending}
      />

      <NoteSheet
        open={!!noteFor}
        meal={noteFor}
        value={noteDraft}
        onChange={setNoteDraft}
        onClose={() => setNoteFor(null)}
        onSave={saveNote}
        saving={compose.isPending}
      />
    </section>
  );
};

/**
 * The party's own line to the kitchen.
 *
 * Its own sheet rather than a textarea in the card: on a phone a keyboard over
 * a scrolling list is the thing that made the manifest form unusable, and this
 * screen already has a day strip and three cards above it.
 */
function NoteSheet({
  open,
  meal,
  value,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  meal: MealType | null;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={(v) => !v && onClose()}
      repositionInputs={false}
    >
      <DrawerContent className="bg-white pb-6">
        <DrawerTitle className="sr-only">A note for the kitchen</DrawerTitle>
        <div className="px-4 pt-2" data-vaul-no-drag>
          <p className="font-cormorant text-[17px] text-[#2B2824]">
            A note for{' '}
            {meal ? (MEAL_LABEL[meal] ?? meal).toLowerCase() : 'the kitchen'}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#797168]">
            Carried to the chef word for word — &ldquo;we&rsquo;re out on the
            boat until one&rdquo; changes how a meal is cooked.
          </p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            maxLength={500}
            autoFocus
            className="mt-3 w-full resize-none rounded-[10px] border border-[#E3E0DA] bg-white px-3 py-2.5 text-[13px] outline-none placeholder:text-[#B0AAA0]"
            placeholder="Anything the kitchen should know?"
          />
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0F1F2E] py-3 text-[10px] font-semibold uppercase tracking-[2px] text-white disabled:opacity-60"
          >
            {saving && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            )}
            Save the note
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
