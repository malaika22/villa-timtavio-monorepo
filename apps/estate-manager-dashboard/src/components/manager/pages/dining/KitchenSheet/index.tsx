'use client';

import { useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Pencil,
  TriangleAlert,
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
import { COURSE_LABELS, COURSES_BY_MEAL } from '@repo/api-types';

import { useKitchenSheet, useAmendMeal } from '@/hooks/useDiningRules';
import { useMenu } from '@/hooks/useMenu';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

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
        days.map((day) => (
          <section key={day.date} className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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

            <div className="grid gap-3 xl:grid-cols-2">
              {day.services.map((service) => (
                <ServiceCard
                  key={`${service.bookingId}:${service.mealType}`}
                  service={service}
                  locked={day.isLocked}
                  onAmend={() => {
                    setAmendingDate(day.date);
                    setAmending(service);
                  }}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {amending && (
        <AmendDialog
          service={amending}
          date={amendingDate}
          dishes={dishes}
          onClose={() => setAmending(null)}
        />
      )}
    </div>
  );
};

function ServiceCard({
  service,
  locked,
  onAmend,
}: {
  service: KitchenService;
  locked: boolean;
  onAmend: () => void;
}) {
  const chosen = service.chosen?.items ?? [];
  const byCourse = COURSES_BY_MEAL[service.mealType].map((course) => ({
    course,
    items: chosen.filter((i) => i.course === course),
  }));

  return (
    <div className="rounded-lg border border-manager-border bg-manager-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-manager-text">
            {MEAL_LABEL[service.mealType] ?? service.mealType} ·{' '}
            {service.partyName}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-manager-text-muted">
            <span className="inline-flex items-center gap-1 font-medium text-manager-text">
              <Clock className="size-3" />
              {service.sittingTime ??
                `no table booked · served ${service.window.start}–${service.window.end}`}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              {service.covers} covers
            </span>
            {(service.lateArrivals ?? []).length > 0 && (
              <span>{service.lateArrivals!.length} arriving late</span>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onAmend}
          className="h-8 border-manager-border bg-white px-2.5 text-xs text-manager-text"
        >
          <Pencil className="mr-1 size-3" />
          {chosen.length > 0 ? 'Swap a dish' : 'Choose for them'}
        </Button>
      </div>

      {/* Repeated on every single service, deliberately. It is the one thing on
          this page that can hurt somebody, and a chef working from a run sheet
          should never have to remember to go and check the manifest. */}
      {service.dietary.length > 0 && (
        <div className="mt-3 rounded-md border border-[#f4c8c1] bg-[#fdf3f1] p-2.5">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#b42318]">
            <TriangleAlert className="size-3" />
            Allergies &amp; diets
          </p>
          <ul className="mt-1 space-y-0.5">
            {service.dietary.map((row) => (
              <li key={row.name} className="text-xs text-[#8f2b21]">
                <span className="font-medium">{row.name}:</span>{' '}
                {[row.allergies, row.restrictions.join(', '), row.other]
                  .filter(Boolean)
                  .join(' · ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {chosen.length === 0 ? (
          <p className="text-xs text-manager-text-muted">
            {locked
              ? 'Nothing was chosen — chef’s choice.'
              : 'Not composed yet. The party can still choose.'}
          </p>
        ) : (
          byCourse.map(
            ({ course, items }) =>
              items.length > 0 && (
                <div key={course}>
                  <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-manager-text-muted">
                    {COURSE_LABELS[course]}
                  </p>
                  <ul className="mt-0.5 space-y-0.5">
                    {items.map((item) => (
                      <li key={item.id} className="text-xs text-manager-text">
                        {item.menuItem.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )
        )}
      </div>

      {/* Verbatim. "We're out on the boat until one" changes how lunch is
          cooked, and a paraphrase would lose that. */}
      {service.note && (
        <p className="mt-3 border-l-2 border-manager-accent bg-[#faf6ee] px-2.5 py-1.5 text-xs italic text-manager-text">
          “{service.note}”
        </p>
      )}

      {service.amendedAt && (
        <p className="mt-2 text-[11px] text-manager-text-muted">
          Amended by {service.amendedByEmail ?? 'the estate'} on{' '}
          {format(new Date(service.amendedAt), 'd MMM HH:mm')}
          {service.chosen?.amendedFrom?.length ? (
            <>
              {' — was '}
              <span className="line-through">
                {service.chosen.amendedFrom.join(', ')}
              </span>
            </>
          ) : null}
        </p>
      )}
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
  onClose,
}: {
  service: KitchenService;
  date: string;
  dishes: MenuItem[];
  onClose: () => void;
}) {
  const amend = useAmendMeal();
  const [picked, setPicked] = useState<string[]>(
    (service.chosen?.items ?? []).map((i) => i.menuItemId),
  );
  const [note, setNote] = useState(service.note ?? '');

  const byCourse = useMemo(() => {
    const map = new Map<MenuCourse, MenuItem[]>();
    for (const dish of dishes) {
      if (!dish.course) continue;
      map.set(dish.course, [...(map.get(dish.course) ?? []), dish]);
    }
    return map;
  }, [dishes]);

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
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl bg-white sm:rounded-xl">
        <div className="flex items-start justify-between gap-3 border-b border-manager-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-manager-text">
              {MEAL_LABEL[service.mealType]} · {service.partyName}
            </h3>
            <p className="mt-0.5 text-xs text-manager-text-muted">
              {format(parseISO(date), 'EEEE d MMMM')} · the party will see the
              change, and the sheet will show what it replaced.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-manager-text-muted hover:bg-[#faf9f7]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {COURSES_BY_MEAL[service.mealType].map((course) => {
            const options = byCourse.get(course) ?? [];
            if (options.length === 0) return null;
            return (
              <div key={course}>
                <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-manager-text-muted">
                  {COURSE_LABELS[course]}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {options.map((dish) => {
                    const on = picked.includes(dish.id);
                    return (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() =>
                          setPicked((prev) =>
                            on
                              ? prev.filter((id) => id !== dish.id)
                              : [...prev, dish.id],
                          )
                        }
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs transition-colors',
                          on
                            ? 'border-manager-accent bg-manager-accent text-white'
                            : 'border-manager-border bg-white text-manager-text hover:bg-[#faf9f7]',
                        )}
                      >
                        {dish.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[1.2px] text-manager-text-muted">
              Note to the kitchen
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              className="mt-1.5 w-full resize-none rounded-lg border border-manager-border px-3 py-2 text-xs outline-none focus:border-manager-accent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-manager-border px-5 py-3">
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
            disabled={amend.isPending}
            className="bg-manager-accent text-white hover:opacity-90"
          >
            {amend.isPending ? 'Saving…' : 'Save for the party'}
          </Button>
        </div>
      </div>
    </div>
  );
}
