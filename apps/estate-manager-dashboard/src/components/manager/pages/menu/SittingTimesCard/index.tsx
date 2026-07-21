'use client';

import { useEffect, useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { useSittingTimes, useUpdateSittingTimes } from '@/hooks/useSittingTimes';
import type { SittingTimes } from '@repo/api-types';

const MEALS: { key: keyof SittingTimes; label: string }[] = [
  { key: 'BREAKFAST', label: 'Breakfast' },
  { key: 'LUNCH', label: 'Lunch' },
  { key: 'DINNER', label: 'Dinner' },
];

const EMPTY: SittingTimes = { BREAKFAST: [], LUNCH: [], DINNER: [] };

// Sensible starting position for each meal's time picker.
const DEFAULT_DRAFT: Record<keyof SittingTimes, string> = {
  BREAKFAST: '08:00',
  LUNCH: '13:00',
  DINNER: '19:00',
};

const MINUTES = [
  '00',
  '05',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
];

function parseHM(t: string): { h: number; m: number } | null {
  const match = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1]!, 10);
  const m = parseInt(match[2]!, 10);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59 ? { h, m } : null;
}

// A compact, themed hour : minute + AM/PM picker replacing the native
// <input type="time">. Emits a 24h "HH:MM" string.
function TimePickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  const base = parseHM(value) ?? { h: 12, m: 0 };
  const h12 = ((base.h + 11) % 12) + 1;
  const ap: 'AM' | 'PM' = base.h >= 12 ? 'PM' : 'AM';
  const mm = String((Math.round(base.m / 5) * 5) % 60).padStart(2, '0');

  const emit = (nh12: number, nmm: string, nap: 'AM' | 'PM') => {
    let h = nh12 % 12;
    if (nap === 'PM') h += 12;
    onChange(`${String(h).padStart(2, '0')}:${nmm}`);
  };

  const selCls =
    'appearance-none rounded-lg border border-manager-border bg-white py-1.5 pl-2.5 pr-6 text-xs font-medium text-manager-text outline-none focus:border-manager-accent';

  return (
    <div className="flex items-center gap-1.5">
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

/** Format a 24h "HH:MM" string into a 12h label like "8:00 AM". */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Append a time to a meal, keeping the list deduped and sorted ascending. */
function addTime(list: string[], time: string): string[] {
  if (!time || list.includes(time)) return list;
  return [...list, time].sort();
}

function isEqual(a: SittingTimes, b: SittingTimes): boolean {
  return MEALS.every(
    ({ key }) =>
      a[key].length === b[key].length &&
      a[key].every((t, i) => t === b[key][i]),
  );
}

export const SittingTimesCard = () => {
  const { data } = useSittingTimes();
  const update = useUpdateSittingTimes();

  const [baseline, setBaseline] = useState<SittingTimes>(EMPTY);
  const [state, setState] = useState<SittingTimes>(EMPTY);
  const [drafts, setDrafts] = useState<Record<keyof SittingTimes, string>>({
    ...DEFAULT_DRAFT,
  });

  // Seed local state from the server whenever it changes and there are no
  // pending local edits.
  useEffect(() => {
    if (!data) return;
    const next: SittingTimes = {
      BREAKFAST: [...data.BREAKFAST].sort(),
      LUNCH: [...data.LUNCH].sort(),
      DINNER: [...data.DINNER].sort(),
    };
    setBaseline(next);
    setState((prev) => (isEqual(prev, baseline) ? next : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const dirty = !isEqual(state, baseline);

  const handleAdd = (key: keyof SittingTimes) => {
    const time = drafts[key];
    if (!time) return;
    setState((prev) => ({ ...prev, [key]: addTime(prev[key], time) }));
    setDrafts((prev) => ({ ...prev, [key]: DEFAULT_DRAFT[key] }));
  };

  const handleRemove = (key: keyof SittingTimes, time: string) => {
    setState((prev) => ({
      ...prev,
      [key]: prev[key].filter((t) => t !== time),
    }));
  };

  const handleSave = () => {
    update.mutate(state, {
      onSuccess: (saved) => {
        const next: SittingTimes = {
          BREAKFAST: [...saved.BREAKFAST].sort(),
          LUNCH: [...saved.LUNCH].sort(),
          DINNER: [...saved.DINNER].sort(),
        };
        setBaseline(next);
        setState(next);
      },
    });
  };

  return (
    <div className="rounded-xl border border-manager-border bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-manager-text">
            Recommended sitting times
          </h2>
          <p className="mt-0.5 text-xs text-manager-text-muted">
            Guests pick from these when reserving a meal — they can still choose
            their own time.
          </p>
        </div>
        <button
          onClick={handleSave}
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
            className="flex flex-col gap-2 rounded-lg border border-[#ebe6df] bg-[#f7f5f2] p-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="w-20 shrink-0 text-xs font-medium text-manager-text-muted">
              {label}
            </span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">
              {state[key].length === 0 && (
                <span className="text-xs text-manager-text-muted/70">
                  No times set
                </span>
              )}
              {state[key].map((time) => (
                <span
                  key={time}
                  className="inline-flex items-center gap-1 rounded-full border border-manager-border bg-white px-2.5 py-1 text-xs font-medium text-manager-text"
                >
                  {formatTime(time)}
                  <button
                    onClick={() => handleRemove(key, time)}
                    className="flex size-3.5 items-center justify-center rounded-full text-manager-text-muted hover:bg-[#fef6f4] hover:text-[#9a3a30]"
                    aria-label={`Remove ${formatTime(time)}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <TimePickerField
                value={drafts[key]}
                onChange={(t) =>
                  setDrafts((prev) => ({ ...prev, [key]: t }))
                }
              />
              <button
                onClick={() => handleAdd(key)}
                disabled={!drafts[key]}
                className="inline-flex items-center gap-1 rounded-lg border border-manager-border bg-white px-2.5 py-1.5 text-xs font-medium text-manager-text hover:bg-[#faf9f7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-3.5" />
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
