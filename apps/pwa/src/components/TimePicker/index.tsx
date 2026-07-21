'use client';

import { cn } from '@repo/ui/lib/utils';
import { Clock, ChevronDown, Sunrise, Sun, Moon, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Shared "estate recommends, guest chooses" time picker — recommended slots
// grouped by time-of-day, plus an always-present custom entry. Used by the
// Experience request sheet and the Dining sitting sheet.

export type TimeChip = { id: string; time: string; disabled?: boolean };
export type TimeGroup = { key: string; chips: TimeChip[] };

const GROUP_ICONS: Record<string, typeof Sun> = {
  Morning: Sunrise,
  Afternoon: Sun,
  Evening: Moon,
};

// Curated recommendations when no preset/configured times exist.
const GENERATED_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:30',
  '16:00',
  '18:00',
  '19:00',
  '19:30',
  '20:30',
  '21:00',
];

export function parseHour(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1]!, 10);
  const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h >= 0 && h <= 23 ? h : null;
}

export function groupKey(hour: number): string {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

// "19:30" → "7:30 PM"; strings that already carry AM/PM (or aren't parseable)
// are returned as-is.
export function formatTimeLabel(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return t;
  if (m[3]) return t.toUpperCase().replace(/\s+/, ' ');
  let h = parseInt(m[1]!, 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
}

export function buildGroups(
  available?: { id: string; time: string; disabled?: boolean }[],
): TimeGroup[] {
  const source: TimeChip[] =
    available && available.length
      ? available.map((s) => ({ id: s.id, time: s.time, disabled: s.disabled }))
      : GENERATED_TIMES.map((t) => ({ id: t, time: t }));

  const buckets = new Map<string, TimeChip[]>();
  const push = (key: string, chip: TimeChip) => {
    const arr = buckets.get(key) ?? [];
    arr.push(chip);
    buckets.set(key, arr);
  };
  for (const chip of source) {
    const h = parseHour(chip.time);
    push(h == null ? 'Recommended' : groupKey(h), chip);
  }

  const order = ['Morning', 'Afternoon', 'Evening', 'Recommended'];
  return order
    .filter((k) => buckets.has(k))
    .map((key) => ({ key, chips: buckets.get(key)! }));
}

/** The first enabled recommendation — a sensible pre-selected default. */
export function firstRecommended(groups: TimeGroup[]): string | undefined {
  return groups.flatMap((g) => g.chips).find((c) => !c.disabled)?.time;
}

export function TimePicker({
  value,
  groups,
  onChange,
}: {
  value: string;
  groups: TimeGroup[];
  onChange: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const isKnown = groups.some((g) => g.chips.some((c) => c.time === value));
  const hour = parseHour(value);
  const subtext = !value
    ? 'Choose a preferred time'
    : isKnown
      ? hour != null
        ? `${groupKey(hour)} seating`
        : 'Recommended'
      : `${hour != null ? `${groupKey(hour)} · ` : ''}your choice`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-3 rounded-[14px] border bg-white px-4 py-3.5 text-left transition-colors',
          open ? 'border-[#0F1F2E] ring-2 ring-[#0F1F2E]/10' : 'border-[#E3E0DA]',
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F1EEE8] text-[#5C534A]">
          <Clock className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-[#2B2824]">
            {value ? formatTimeLabel(value) : 'Select a time'}
          </span>
          <span className="block text-[11px] text-[#797168]">{subtext}</span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[#B0AAA0] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full origin-top overflow-hidden rounded-[16px] border border-[#E3E0DA] bg-white shadow-[0_18px_40px_rgba(30,26,20,0.14)] animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {groups.map((g) => {
            const Icon = GROUP_ICONS[g.key] ?? Clock;
            return (
              <div key={g.key} className="border-b border-[#F1EEE8] px-4 pb-3 pt-3">
                <p className="mb-2.5 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[2px] text-[#C8A96E]">
                  <Icon className="size-3" strokeWidth={2} /> {g.key}
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.chips.map((c) => {
                    const active = c.time === value;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={c.disabled}
                        onClick={() => {
                          onChange(c.time);
                          setOpen(false);
                        }}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors',
                          active
                            ? 'border-[#0F1F2E] bg-[#0F1F2E] font-medium text-white'
                            : 'border-[#E3E0DA] text-[#453F38] hover:border-[#C8A96E]',
                          c.disabled && 'cursor-not-allowed line-through opacity-40',
                        )}
                      >
                        {formatTimeLabel(c.time)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Custom fallback — always available, even when slots exist */}
          <div className="flex items-center justify-between gap-3 bg-[#FBFAF8] px-4 py-3">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#453F38]">
              <Pencil className="size-3.5 text-[#C8A96E]" strokeWidth={2} />
              Prefer another time?
            </span>
            <input
              type="time"
              value={isKnown ? '' : value}
              onChange={(e) => onChange(e.target.value)}
              className="rounded-[10px] border border-[#E3E0DA] bg-white px-3 py-1.5 text-[12.5px] text-[#2B2824] outline-none focus:border-[#0F1F2E]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
