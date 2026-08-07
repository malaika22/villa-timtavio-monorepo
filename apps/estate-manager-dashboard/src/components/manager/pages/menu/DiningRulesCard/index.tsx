'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { DiningRules, MealType, MenuCourse } from '@repo/api-types';
import { COURSE_LABELS, COURSES_BY_MEAL } from '@repo/api-types';
import { useDiningRules, useUpdateDiningRules } from '@/hooks/useDiningRules';

const MEALS: { key: MealType; label: string }[] = [
  { key: 'BREAKFAST', label: 'Breakfast' },
  { key: 'LUNCH', label: 'Lunch' },
  { key: 'DINNER', label: 'Dinner' },
];

const MINUTES = ['00', '15', '30', '45'];

function parseHM(t: string): { h: number; m: number } | null {
  const match = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1]!, 10);
  const m = parseInt(match[2]!, 10);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59 ? { h, m } : null;
}

/** A compact hour : minute + AM/PM control. Emits 24h "HH:MM". */
function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  const base = parseHM(value) ?? { h: 12, m: 0 };
  const h12 = ((base.h + 11) % 12) + 1;
  const ap: 'AM' | 'PM' = base.h >= 12 ? 'PM' : 'AM';
  const mm = String((Math.round(base.m / 15) * 15) % 60).padStart(2, '0');

  const emit = (nh12: number, nmm: string, nap: 'AM' | 'PM') => {
    let h = nh12 % 12;
    if (nap === 'PM') h += 12;
    onChange(`${String(h).padStart(2, '0')}:${nmm}`);
  };

  const selCls =
    'appearance-none rounded-lg border border-manager-border bg-white py-1.5 pl-2.5 pr-6 text-xs font-medium text-manager-text outline-none focus:border-manager-accent';

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <select
          aria-label="Hour"
          value={h12}
          onChange={(e) => emit(Number(e.target.value), mm, ap)}
          className={selCls}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-manager-text-muted" />
      </div>
      <span className="text-sm font-semibold text-manager-text-muted">:</span>
      <div className="relative">
        <select
          aria-label="Minute"
          value={mm}
          onChange={(e) => emit(h12, e.target.value, ap)}
          className={selCls}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-manager-text-muted" />
      </div>
      <div className="inline-flex rounded-lg border border-manager-border bg-white p-0.5">
        {(['AM', 'PM'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => emit(h12, mm, p)}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
              ap === p
                ? 'bg-manager-accent text-white'
                : 'text-manager-text-muted hover:text-manager-text',
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * A number you can clear.
 *
 * Bound straight to a number, these fields were impossible to edit: backspace
 * emptied the box, the change handler read '' as 0, the clamp turned that back
 * into the minimum, and the old value reappeared under the cursor. Worse, a
 * field showing 0 that you typed 48 into read "048". So the text is held as
 * text while you type, and only becomes a number when you leave.
 */
function NumberField({
  value,
  min,
  max,
  onCommit,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
  ariaLabel: string;
}) {
  const [text, setText] = useState(String(value));

  // Follow the server when it answers, but never while the box is being typed
  // into — that is what made it snap back mid-keystroke.
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
        setText(raw);
        if (raw !== '') onCommit(clamp(Number(raw)));
      }}
      onBlur={() => {
        const next = text === '' ? min : clamp(Number(text));
        setText(String(next));
        onCommit(next);
      }}
      className="w-20 rounded-lg border border-manager-border bg-white px-2.5 py-1.5 text-xs font-medium tabular-nums text-manager-text outline-none focus:border-manager-accent"
    />
  );
}

/**
 * The three rules the estate sets once: when each meal is served, how much a
 * party may choose, and how long before service a day closes.
 *
 * They sit on one card because they answer one question between them — what a
 * guest is allowed to ask for. Split across two screens is how an estate ends
 * up with a 24-hour cutoff and a menu nobody can change in time.
 */
export const DiningRulesCard = () => {
  const { data } = useDiningRules();
  const update = useUpdateDiningRules();

  const [state, setState] = useState<DiningRules | null>(null);

  useEffect(() => {
    if (data) setState(structuredClone(data));
  }, [data]);

  if (!state || !data) {
    return (
      <div className="h-64 animate-pulse rounded-xl bg-manager-border" />
    );
  }

  const dirty = JSON.stringify(state) !== JSON.stringify(data);

  const setWindow = (
    meal: MealType,
    field: 'start' | 'end' | 'lastSeating',
    value: string,
  ) =>
    setState((prev) =>
      prev
        ? {
            ...prev,
            windows: {
              ...prev.windows,
              [meal]: { ...prev.windows[meal], [field]: value },
            },
          }
        : prev,
    );

  const setLimit = (course: MenuCourse, value: number) =>
    setState((prev) =>
      prev
        ? {
            ...prev,
            menu: {
              ...prev.menu,
              courseLimits: { ...prev.menu.courseLimits, [course]: value },
            },
          }
        : prev,
    );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-manager-border bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-manager-text">
              Service windows
            </h2>
            <p className="mt-0.5 max-w-xl text-xs text-manager-text-muted">
              When each meal runs, and the latest you can still seat a table.
              Guests choose any time between the start and the last seating —
              they can no longer pick the closing minute and arrive as the
              kitchen shuts.
            </p>
          </div>
          <button
            onClick={() => update.mutate(state)}
            disabled={!dirty || update.isPending}
            className="inline-flex items-center rounded-lg bg-manager-accent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {MEALS.map(({ key, label }) => (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-lg border border-[#ebe6df] bg-[#f7f5f2] p-3 lg:flex-row lg:items-center"
            >
              <span className="w-20 shrink-0 text-xs font-medium text-manager-text-muted">
                {label}
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-manager-text-muted">
                  From
                  <TimeField
                    value={state.windows[key].start}
                    onChange={(t) => setWindow(key, 'start', t)}
                  />
                </label>
                <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-manager-text-muted">
                  Until
                  <TimeField
                    value={state.windows[key].end}
                    onChange={(t) => setWindow(key, 'end', t)}
                  />
                </label>
                <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-manager-text-muted">
                  Last seating
                  <TimeField
                    value={state.windows[key].lastSeating}
                    onChange={(t) => setWindow(key, 'lastSeating', t)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-manager-border bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.04)]">
        <h2 className="text-sm font-semibold text-manager-text">
          What a party may choose
        </h2>
        <p className="mt-0.5 max-w-xl text-xs text-manager-text-muted">
          The allowance per course, exactly as the printed menu states it. The
          guest app counts against these and won&rsquo;t let a party go over.
        </p>

        <div className="mt-4 space-y-3">
          {MEALS.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-lg border border-[#ebe6df] bg-[#f7f5f2] p-3"
            >
              <p className="text-xs font-medium text-manager-text-muted">
                {label}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {COURSES_BY_MEAL[key].map((course) => (
                  <label
                    key={course}
                    className="flex items-center gap-2 text-xs text-manager-text"
                  >
                    <span className="min-w-[7.5rem]">
                      {COURSE_LABELS[course]}
                    </span>
                    <NumberField
                      value={state.menu.courseLimits[course]}
                      min={1}
                      max={30}
                      ariaLabel={`${COURSE_LABELS[course]} allowance`}
                      onCommit={(n) => setLimit(course, n)}
                    />
                    <span className="text-manager-text-muted">dishes</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-manager-border bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.04)]">
        <h2 className="text-sm font-semibold text-manager-text">
          When a day closes
        </h2>
        <p className="mt-0.5 max-w-xl text-xs text-manager-text-muted">
          Counted back from midnight at the <em>start</em> of the service day,
          so the kitchen can order against a settled menu. Past it the party
          can no longer change that day — you still can, and the run sheet says
          who did.
        </p>

        <label className="mt-4 flex flex-wrap items-center gap-2 text-xs text-manager-text">
          <NumberField
            value={state.menu.cutoffHours}
            min={0}
            max={168}
            ariaLabel="Hours before the day begins"
            onCommit={(n) =>
              setState((prev) =>
                prev ? { ...prev, menu: { ...prev.menu, cutoffHours: n } } : prev,
              )
            }
          />
          hours before the day begins
          <span className="text-manager-text-muted">
            — at {state.menu.cutoffHours}, a Tuesday is settled by{' '}
            {cutoffExample(state.menu.cutoffHours)}.
          </span>
        </label>
      </div>
    </div>
  );
};

/**
 * Say the rule back in plain words.
 *
 * "24 hours before midnight at the start of the day" is arithmetic nobody
 * should have to do in their head to know whether they've set it right, so the
 * card works one out against a real Tuesday — 6 January 1970 was one.
 */
function cutoffExample(hours: number): string {
  const tuesday = Date.UTC(1970, 0, 6);
  const deadline = new Date(tuesday - hours * 60 * 60 * 1000);
  const day = deadline.toLocaleDateString('en-GB', {
    weekday: 'long',
    timeZone: 'UTC',
  });
  const time = deadline.toISOString().slice(11, 16);
  return `${day} at ${time}`;
}
