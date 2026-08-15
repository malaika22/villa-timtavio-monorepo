'use client';

import { useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import {
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Pencil,
  Plus,
  Search,
  TriangleAlert,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui';
import type {
  KitchenService,
  MealType,
  MenuCourse,
  MenuItem,
} from '@repo/api-types';
import { COURSE_LABELS, COURSES_BY_MEAL, dietaryLabel } from '@repo/api-types';

/** One person's restrictions, in the words the manifest form used. */
const dietaryLine = (row: {
  allergies?: string | null;
  restrictions: string[];
  other?: string | null;
}) =>
  [row.allergies, row.restrictions.map(dietaryLabel).join(', '), row.other]
    .filter(Boolean)
    .join(' · ');

import {
  useKitchenSheet,
  useAmendMeal,
  useNudgeParty,
  useRemoveMeal,
} from '@/hooks/useDiningRules';
import { useMenu } from '@/hooks/useMenu';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

/** "09:30" → 570, for sorting. Falls back to the window when no table is booked. */
const atMinute = (s: KitchenService) => {
  const t = s.sittingTime ?? s.window.start;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

/**
 * Day → party → services, each party's meals in the order they're cooked.
 *
 * Booking order put breakfast, lunch and dinner side by side across two
 * columns, so the day had no shape at all. A chef reads a service sheet
 * forwards.
 */
function groupByParty(services: KitchenService[]) {
  const map = new Map<string, KitchenService[]>();
  for (const s of services) {
    map.set(s.bookingId, [...(map.get(s.bookingId) ?? []), s]);
  }
  return [...map.entries()].map(([bookingId, list]) => ({
    bookingId,
    partyName: list[0]!.partyName,
    covers: list[0]!.covers,
    dietary: list[0]!.dietary,
    services: [...list].sort((a, b) => atMinute(a) - atMinute(b)),
  }));
}

/**
 * What the kitchen is cooking, day by day, for whoever is in the villa.
 *
 * This replaces confirming sittings one at a time. There was nothing to
 * decide — a table inside the estate's own window, on a day it serves, for a
 * party already staying — so the page stopped being an inbox and became the
 * sheet the chef actually works from: covers, time, dishes, and who can't eat
 * what.
 */
export const KitchenSheet = () => {
  const [offset, setOffset] = useState(0);
  const from = iso(addDays(new Date(), offset * 7));
  const to = iso(addDays(new Date(), offset * 7 + 6));

  const { data, isLoading } = useKitchenSheet(from, to);
  const { data: dishes = [] } = useMenu();
  const addMeal = useAmendMeal();
  const removeMeal = useRemoveMeal();
  const nudge = useNudgeParty();
  const [amending, setAmending] = useState<KitchenService | null>(null);
  const [amendingDate, setAmendingDate] = useState<string>('');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-manager-border" />
        ))}
      </div>
    );
  }

  const days = data?.days ?? [];
  const stillOpen = days.reduce(
    (n, d) =>
      n +
      (d.isLocked
        ? 0
        : d.services.filter((s) => !s.chosen?.items.length).length),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-manager-text">
            {format(parseISO(from), 'd MMM')} – {format(parseISO(to), 'd MMM')}
          </h2>
          <p className="mt-0.5 text-xs text-manager-text-muted">
            {stillOpen > 0
              ? `${stillOpen} meal${stillOpen === 1 ? '' : 's'} still open — worth chasing before they fall to the chef.`
              : 'Every open meal has been composed.'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="flex size-8 items-center justify-center rounded-lg border border-manager-border bg-white text-manager-text-muted hover:bg-[#faf9f7]"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setOffset(0)}
            className="rounded-lg border border-manager-border bg-white px-3 py-1.5 text-xs font-medium text-manager-text hover:bg-[#faf9f7]"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="flex size-8 items-center justify-center rounded-lg border border-manager-border bg-white text-manager-text-muted hover:bg-[#faf9f7]"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-manager-border bg-manager-card p-12 text-center">
          <UtensilsCrossed
            className="mx-auto mb-3 size-6 text-manager-text-muted"
            aria-hidden
          />
          <p className="text-sm font-medium text-manager-text">
            Nobody in the villa these days
          </p>
          <p className="mt-1 text-sm text-manager-text-muted">
            Meals appear here for every stay in residence.
          </p>
        </div>
      ) : (
        days.map((day) => {
          // Grouped by party. A villa cooks for one at a time, so repeating
          // the name on every card was six copies of the same fact — and when
          // there really are two stays, this is the only way to tell whose
          // allergy is whose.
          const parties = groupByParty(day.services);

          return (
            <section key={day.date} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-manager-border pb-1.5">
                <h3 className="text-sm font-semibold text-manager-text">
                  {format(parseISO(day.date), 'EEEE d MMMM')}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    day.isLocked
                      ? 'bg-[#eef0f5] text-[#3a4a6b]'
                      : 'bg-[#faf0dc] text-[#8a6d3b]',
                  )}
                >
                  {day.isLocked ? (
                    <>
                      <Lock className="size-2.5" /> Settled
                    </>
                  ) : (
                    <>
                      <Clock className="size-2.5" /> Closes{' '}
                      {format(new Date(day.closesAt), 'EEE HH:mm')}
                    </>
                  )}
                </span>
              </div>

              {parties.map((party) => {
                const open = party.services.filter(
                  (s) => !s.chosen?.items.length,
                ).length;
                const missing = (
                  ['BREAKFAST', 'LUNCH', 'DINNER'] as MealType[]
                ).filter(
                  (m) => !party.services.some((s) => s.mealType === m),
                );

                return (
                  <div key={party.bookingId} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <p className="text-xs font-medium text-manager-text">
                        {party.partyName}
                        <span className="ml-2 font-normal text-manager-text-muted">
                          party of {party.covers}
                          {open > 0
                            ? ` · ${open} meal${open === 1 ? '' : 's'} still open`
                            : ''}
                        </span>
                      </p>

                      {open > 0 && !day.isLocked && (
                        <button
                          type="button"
                          onClick={() =>
                            nudge.mutate({
                              bookingId: party.bookingId,
                              date: day.date,
                            })
                          }
                          disabled={nudge.isPending}
                          className="inline-flex items-center gap-1 rounded-full border border-manager-border bg-white px-2.5 py-0.5 text-[11px] font-medium text-manager-text hover:bg-[#faf9f7]"
                        >
                          <BellRing className="size-3" />
                          Nudge the party
                        </button>
                      )}

                      {/* A dawn flight is a real thing, and the concierge is
                          the one who knows about it. */}
                      {missing.map((meal) => (
                        <button
                          key={meal}
                          type="button"
                          onClick={() =>
                            addMeal.mutate({
                              bookingId: party.bookingId,
                              dto: {
                                date: day.date,
                                mealType: meal,
                                menuItemIds: [],
                              },
                            })
                          }
                          disabled={addMeal.isPending}
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-manager-border px-2.5 py-0.5 text-[11px] text-manager-text-muted hover:border-manager-accent hover:text-manager-text"
                        >
                          <Plus className="size-3" />
                          Serve {MEAL_LABEL[meal].toLowerCase()}
                        </button>
                      ))}
                    </div>

                    {/* Once, loudly, under the day — and again quietly on each
                        ticket below. Six identical red boxes stopped being a
                        warning and became wallpaper. */}
                    {party.dietary.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[#f4c8c1] bg-[#fdf3f1] px-2.5 py-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#b42318]">
                          <TriangleAlert className="size-3" />
                          Allergies
                        </span>
                        {party.dietary.map((row) => (
                          <span key={row.name} className="text-xs text-[#8f2b21]">
                            <span className="font-medium">{row.name}:</span>{' '}
                            {dietaryLine(row)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
                      {party.services.map((service) => (
                        <Ticket
                          key={`${service.bookingId}:${service.mealType}`}
                          service={service}
                          locked={day.isLocked}
                          onAmend={() => {
                            setAmendingDate(day.date);
                            setAmending(service);
                          }}
                          onRemove={() =>
                            removeMeal.mutate({
                              bookingId: service.bookingId,
                              date: day.date,
                              mealType: service.mealType,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })
      )}

      {amending && (
        <AmendDialog
          service={amending}
          date={amendingDate}
          dishes={dishes}
          limits={data?.rules.menu.courseLimits}
          onClose={() => setAmending(null)}
        />
      )}
    </div>
  );
};

/**
 * One service, as a docket.
 *
 * The dish is the biggest thing on it. Before, the party name, the meal and
 * the covers were all set above the only thing the chef was actually reading,
 * and the allergy box outweighed the food entirely — repeated at that weight
 * six times over it stopped being a warning and became wallpaper.
 */
function Ticket({
  service,
  locked,
  onAmend,
  onRemove,
}: {
  service: KitchenService;
  locked: boolean;
  onAmend: () => void;
  onRemove: () => void;
}) {
  const chosen = service.chosen?.items ?? [];
  const composed = chosen.length > 0;
  const byCourse = COURSES_BY_MEAL[service.mealType].map((course) => ({
    course,
    items: chosen.filter((i) => i.course === course),
  }));

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-manager-card',
        composed
          ? 'border-manager-border'
          : 'border-dashed border-manager-border opacity-80',
      )}
    >
      <div className="flex items-center gap-2 border-b border-manager-border bg-[#f7f5f2] px-3 py-1.5">
        <span className="font-mono text-sm font-bold tabular-nums text-manager-text">
          {service.sittingTime ?? '—'}
        </span>
        <span className="text-xs font-semibold text-manager-text">
          {MEAL_LABEL[service.mealType] ?? service.mealType}
        </span>
        {!service.sittingTime && (
          <span className="text-[10.5px] text-manager-text-muted">
            served {service.window.start}–{service.window.end}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-manager-text-muted">
          <Users className="size-3" />
          {service.covers}
          {(service.lateArrivals ?? []).length > 0 && (
            <span className="ml-1 text-[#8a6d3b]">
              +{service.lateArrivals!.length} late
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onAmend}
          className="flex size-6 shrink-0 items-center justify-center rounded text-manager-text-muted hover:bg-white hover:text-manager-text"
          aria-label={composed ? 'Swap a dish' : 'Choose for them'}
          title={composed ? 'Swap a dish' : 'Choose for them'}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 px-3 py-2">
        {composed ? (
          <div className="space-y-1">
            {byCourse.map(
              ({ course, items }) =>
                items.length > 0 && (
                  <div
                    key={course}
                    className="grid grid-cols-[5.5rem_1fr] items-start gap-2"
                  >
                    <span className="pt-[3px] text-[9px] font-semibold uppercase leading-tight tracking-[1px] text-manager-text-muted">
                      {COURSE_LABELS[course]}
                    </span>
                    {/* One dish per line. Joined with "·" they ran together
                        into a paragraph — five Spanish dish names wrapped to
                        three lines with no way to tell where one ended and the
                        next began, on the sheet a chef reads at a glance while
                        cooking. A ticket is a list, so it reads as one. */}
                    <ul className="space-y-[3px]">
                      {items.map((i) => (
                        <li
                          key={i.menuItem.id ?? i.menuItem.name}
                          className="text-[12.5px] leading-snug text-manager-text"
                        >
                          {i.menuItem.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
            )}
          </div>
        ) : (
          <p className="text-xs italic text-manager-text-muted">
            {locked
              ? 'Nothing was chosen — chef’s choice.'
              : 'Not composed. The party can still choose.'}
          </p>
        )}

        {/* Verbatim. "We're out on the boat until one" changes how lunch is
            cooked, and a paraphrase would lose that. */}
        {service.note && (
          <p className="mt-2 border-l-2 border-manager-accent bg-[#faf6ee] px-2 py-1 text-[11px] italic text-manager-text">
            “{service.note}”
          </p>
        )}
      </div>

      {/* No allergy line here. It sits once under the day, directly above and
          always in view — repeating it on every ticket made a wall of red
          longer than the food, which is how a warning turns into wallpaper.
          The amend dialog still carries it: that screen has no day above it. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-manager-border px-3 py-1.5 text-[10.5px] text-manager-text-muted empty:hidden">
        {service.addedByEstate && (
          <span className="inline-flex items-center gap-1">
            Added by the estate
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-0.5 text-manager-text-muted hover:text-[#b42318]"
            >
              <Trash2 className="size-3" />
              remove
            </button>
          </span>
        )}

        {service.amendedAt && (
          <span>
            {/* An auth0| subject or a missing claim is not a name. */}
            Amended by{' '}
            {service.amendedByEmail?.includes('@')
              ? service.amendedByEmail
              : 'the estate'}{' '}
            {format(new Date(service.amendedAt), 'd MMM HH:mm')}
            {service.chosen?.amendedFrom?.length ? (
              <>
                {' — was '}
                <span className="line-through">
                  {service.chosen.amendedFrom.join(', ')}
                </span>
              </>
            ) : null}
          </span>
        )}

        {!composed && !locked && (
          <button
            type="button"
            onClick={onAmend}
            className="ml-auto font-medium text-manager-accent hover:underline"
          >
            Choose for them
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Changing a meal on the party's behalf.
 *
 * The only thing the estate can do that the guest can't: amend a day after the
 * cutoff. It keeps the same allowances the party composes within, so a swap
 * can't quietly put four mains on a table set for one.
 */
function AmendDialog({
  service,
  date,
  dishes,
  limits,
  onClose,
}: {
  service: KitchenService;
  date: string;
  dishes: MenuItem[];
  /** The same allowances the party composes within. */
  limits?: Record<MenuCourse, number>;
  onClose: () => void;
}) {
  const amend = useAmendMeal();
  const was = useMemo(
    () => (service.chosen?.items ?? []).map((i) => i.menuItemId),
    [service.chosen],
  );
  const [picked, setPicked] = useState<string[]>(was);
  const [note, setNote] = useState(service.note ?? '');
  const [query, setQuery] = useState('');

  const courses = COURSES_BY_MEAL[service.mealType];

  const byCourse = useMemo(() => {
    const map = new Map<MenuCourse, MenuItem[]>();
    for (const dish of dishes) {
      if (!dish.course) continue;
      map.set(dish.course, [...(map.get(dish.course) ?? []), dish]);
    }
    return map;
  }, [dishes]);

  const dishById = useMemo(
    () => new Map(dishes.map((d) => [d.id, d])),
    [dishes],
  );

  const limitFor = (course: MenuCourse) => limits?.[course] ?? 1;
  const countFor = (course: MenuCourse) =>
    picked.filter((id) => dishById.get(id)?.course === course).length;

  /**
   * Same rule the guest app uses. At an allowance of one the obvious gesture
   * is "give them that one instead", so a second tap swaps; above one, a full
   * course refuses, because silently reshuffling someone else's dinner is not
   * a thing to do on their behalf.
   */
  const toggle = (dish: MenuItem, course: MenuCourse) =>
    setPicked((prev) => {
      if (prev.includes(dish.id)) return prev.filter((id) => id !== dish.id);
      const current = prev.filter((id) => dishById.get(id)?.course === course);
      if (current.length >= limitFor(course)) {
        if (limitFor(course) !== 1) return prev;
        return [...prev.filter((id) => id !== current[0]), dish.id];
      }
      return [...prev, dish.id];
    });

  const changed =
    picked.length !== was.length ||
    picked.some((id) => !was.includes(id)) ||
    (note.trim() || '') !== (service.note ?? '');

  const matches = (dish: MenuItem) =>
    !query.trim() ||
    dish.name.toLowerCase().includes(query.trim().toLowerCase()) ||
    (dish.description ?? '').toLowerCase().includes(query.trim().toLowerCase());

  const save = () =>
    amend.mutate(
      {
        bookingId: service.bookingId,
        dto: {
          date,
          mealType: service.mealType as MealType,
          menuItemIds: picked,
          note: note.trim() || undefined,
        },
      },
      { onSuccess: onClose },
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl bg-white sm:rounded-xl">
        {/* ── Who, when, and what they can't eat ──────────────────────── */}
        <div className="border-b border-manager-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-manager-text">
                {MEAL_LABEL[service.mealType]} · {service.partyName}
              </h3>
              <p className="mt-0.5 text-xs text-manager-text-muted">
                {format(parseISO(date), 'EEEE d MMMM')} ·{' '}
                {service.sittingTime ?? `served ${service.window.start}–${service.window.end}`}{' '}
                · {service.covers} covers
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-manager-text-muted hover:bg-[#faf9f7]"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* You are choosing food for someone who can't eat some of it, and
              the dialog used to be the one screen in the flow that didn't say
              so. */}
          {service.dietary.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[#f4c8c1] bg-[#fdf3f1] px-2.5 py-1.5">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#b42318]">
                <TriangleAlert className="size-3" />
                Allergies
              </span>
              {service.dietary.map((row) => (
                <span key={row.name} className="text-xs text-[#8f2b21]">
                  <span className="font-medium">{row.name}:</span>{' '}
                  {dietaryLine(row)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── What's on the ticket right now ──────────────────────────── */}
        <div className="border-b border-manager-border bg-[#faf9f7] px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-manager-text-muted">
            On the ticket
          </p>
          {picked.length === 0 ? (
            <p className="mt-1 text-xs italic text-manager-text-muted">
              Nothing chosen — the chef would cook their own.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {courses.flatMap((course) =>
                picked
                  .filter((id) => dishById.get(id)?.course === course)
                  .map((id) => {
                    const dish = dishById.get(id);
                    if (!dish) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(dish, course)}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-manager-accent bg-white px-2.5 py-1 text-xs text-manager-text"
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-manager-text-muted">
                          {COURSE_LABELS[course]}
                        </span>
                        {dish.name}
                        <X className="size-3 text-manager-text-muted group-hover:text-[#b42318]" />
                      </button>
                    );
                  }),
              )}
            </div>
          )}
        </div>

        {/* ── The menu to choose from ─────────────────────────────────── */}
        <div className="border-b border-manager-border px-5 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-manager-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search the ${MEAL_LABEL[service.mealType].toLowerCase()} menu…`}
              className="w-full rounded-lg border border-manager-border bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-manager-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {courses.map((course) => {
            const options = (byCourse.get(course) ?? []).filter(matches);
            const limit = limitFor(course);
            const count = countFor(course);
            const full = count >= limit;

            return (
              <div key={course} className="mb-4 last:mb-0">
                <div className="sticky top-0 z-[1] -mx-1 flex items-baseline justify-between gap-2 bg-white px-1 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-manager-text-muted">
                    {COURSE_LABELS[course]}
                  </p>
                  <p
                    className={cn(
                      'text-[11px] tabular-nums',
                      full
                        ? 'font-semibold text-[#3a6448]'
                        : 'text-manager-text-muted',
                    )}
                  >
                    {count} of {limit}
                    {limit === 1 && count === 1 && (
                      <span className="ml-1.5 font-normal text-manager-text-muted">
                        · picking another swaps it
                      </span>
                    )}
                  </p>
                </div>

                {options.length === 0 ? (
                  <p className="px-1 py-2 text-xs italic text-manager-text-muted">
                    Nothing on this course matches “{query}”.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#f2efe9] rounded-lg border border-manager-border">
                    {options.map((dish) => {
                      const on = picked.includes(dish.id);
                      // A full course above one genuinely can't take more.
                      const blocked = !on && full && limit !== 1;
                      return (
                        <li key={dish.id}>
                          <button
                            type="button"
                            disabled={blocked}
                            onClick={() => toggle(dish, course)}
                            className={cn(
                              'flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors',
                              on ? 'bg-[#faf6ee]' : 'hover:bg-[#faf9f7]',
                              blocked && 'cursor-not-allowed opacity-40',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                                on
                                  ? 'border-manager-accent bg-manager-accent text-white'
                                  : 'border-manager-border',
                              )}
                              aria-hidden
                            >
                              {on && <Check className="size-2.5" strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-medium text-manager-text">
                                {dish.name}
                              </span>
                              {dish.description && (
                                <span className="mt-0.5 block text-[11px] leading-snug text-manager-text-muted">
                                  {dish.description}
                                </span>
                              )}
                              {(dish.containsNuts ||
                                dish.containsShellfish ||
                                dish.containsDairy) && (
                                <span className="mt-0.5 block text-[9.5px] font-medium uppercase tracking-wide text-[#b42318]">
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
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Note, then the change itself ────────────────────────────── */}
        <div className="border-t border-manager-border px-5 py-3">
          <label className="text-[10px] font-semibold uppercase tracking-[1.2px] text-manager-text-muted">
            Note to the kitchen
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Anything the chef should know — carried onto the ticket word for word."
            className="mt-1.5 w-full resize-none rounded-lg border border-manager-border px-3 py-2 text-xs outline-none focus:border-manager-accent"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-manager-border bg-[#faf9f7] px-5 py-3">
          <p className="text-[11px] text-manager-text-muted">
            {changed
              ? 'The party will see this, and the ticket will show what it replaced.'
              : 'Nothing changed yet.'}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-manager-border bg-white text-manager-text"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={amend.isPending || !changed}
              className="bg-manager-accent text-white hover:opacity-90"
            >
              {amend.isPending ? 'Saving…' : 'Save for the party'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
