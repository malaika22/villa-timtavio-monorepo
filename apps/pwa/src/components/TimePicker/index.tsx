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

/** "09:30" → 570. Null when it isn't a 24h clock time. */
export function toMinutes(t?: string | null): number | null {
  if (typeof t !== 'string') return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59 ? h * 60 + min : null;
}

function toClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  return `${String(h).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Half-hourly tables across a service window, ending at the last seating.
 *
 * The estate says when it serves; this turns that into something tappable. The
 * window stops at `lastSeating` rather than `end` on purpose — a guest offered
 * the closing time arrived exactly as the kitchen shut, which is the whole
 * reason the estate configures a last seating at all.
 */
export function windowGroups(
  window?: { start: string; lastSeating: string; end: string } | null,
  stepMinutes = 30,
): TimeGroup[] {
  const start = toMinutes(window?.start);
  const last = toMinutes(window?.lastSeating) ?? toMinutes(window?.end);
  if (start == null || last == null || last < start) return buildGroups();

  const chips: { id: string; time: string }[] = [];
  for (let m = start; m <= last && chips.length < 24; m += stepMinutes) {
    chips.push({ id: toClock(m), time: toClock(m) });
  }
  return buildGroups(chips);
}

export function TimePicker({
  value,
  groups,
  onChange,
  min,
  max,
}: {
  value: string;
  groups: TimeGroup[];
  onChange: (t: string) => void;
  /**
   * The service window, when there is one. A free-typed time outside it is
   * refused by the API anyway; bounding it here is what stops the guest finding
   * that out only after they've pressed the button.
   */
  min?: string | null;
  max?: string | null;
}) {
  const [open, setOpen] = useState(false);
  // When the trigger sits low in the viewport, open the panel upward so its
  // full height (incl. the "Prefer another time?" row) stays reachable and
  // never hides behind a sticky CTA.
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () =>
    setOpen((o) => {
      const next = !o;
      if (next && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setDropUp(rect.bottom > window.innerHeight * 0.55);
      }
      return next;
    });

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

  // Nudge the opened panel fully into view within its scroll container.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      dropdownRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }, 60);
    return () => window.clearTimeout(id);
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
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
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
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-30 w-full overflow-hidden rounded-[16px] border border-[#E3E0DA] bg-white shadow-[0_18px_40px_rgba(30,26,20,0.14)] animate-in fade-in-0 duration-200',
            dropUp
              ? 'bottom-full mb-2 origin-bottom slide-in-from-bottom-2'
              : 'top-full mt-2 origin-top slide-in-from-top-2',
          )}
        >
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
          <div className="bg-[#FBFAF8] px-4 py-3">
            <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-medium text-[#453F38]">
              <Pencil className="size-3.5 text-[#C8A96E]" strokeWidth={2} />
              Prefer another time?
            </div>
            <CustomTimeEntry
              value={value}
              onChange={onChange}
              min={min}
              max={max}
            />
            {min && max && (
              <p className="mt-2 text-[10.5px] leading-snug text-[#797168]">
                Served {formatTimeLabel(min)}–{formatTimeLabel(max)}. Anything
                outside that, and your concierge will arrange it.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// A themed hour : minute + AM/PM picker, replacing the native <input type="time">
// (which opens the OS wheel). Emits 24h "HH:MM" to match the rest of the picker.

const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function parseHM(t: string): { h: number; m: number } | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59 ? { h, m: min } : null;
}

function CustomTimeEntry({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (t: string) => void;
  min?: string | null;
  max?: string | null;
}) {
  const base = parseHM(value) ?? { h: 19, m: 0 };
  const h12 = ((base.h + 11) % 12) + 1;
  const ap: 'AM' | 'PM' = base.h >= 12 ? 'PM' : 'AM';
  const mm = String((Math.round(base.m / 5) * 5) % 60).padStart(2, '0');

  const lo = toMinutes(min);
  const hi = toMinutes(max);

  /** Whether any minute of this hour falls inside the window. */
  const hourAllowed = (hour12: number, meridiem: 'AM' | 'PM') => {
    if (lo == null || hi == null) return true;
    const h = (hour12 % 12) + (meridiem === 'PM' ? 12 : 0);
    return h * 60 + 59 >= lo && h * 60 <= hi;
  };

  // Pull an out-of-window time back to the nearest edge rather than letting it
  // through to a 400. The guest sees the value move, which is the honest
  // signal that they've reached the end of service.
  const emit = (nh12: number, nmm: string, nap: 'AM' | 'PM') => {
    let h = nh12 % 12;
    if (nap === 'PM') h += 12;
    let total = h * 60 + Number(nmm);
    if (lo != null && total < lo) total = lo;
    if (hi != null && total > hi) total = hi;
    onChange(toClock(total));
  };

  const selCls =
    'appearance-none rounded-[10px] border border-[#E3E0DA] bg-white py-1.5 pl-3 pr-7 text-[13px] font-medium text-[#2B2824] outline-none focus:border-[#0F1F2E]';

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
            <option key={h} value={h} disabled={!hourAllowed(h, ap)}>
              {h}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-[#B0AAA0]" />
      </div>
      <span className="text-[14px] font-semibold text-[#B0AAA0]">:</span>
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
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-[#B0AAA0]" />
      </div>
      <div className="ml-1 inline-flex rounded-[10px] border border-[#E3E0DA] bg-white p-0.5">
        {(['AM', 'PM'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => emit(h12, mm, p)}
            className={cn(
              'rounded-[8px] px-2.5 py-1 text-[11px] font-semibold transition-colors',
              ap === p ? 'bg-[#0F1F2E] text-white' : 'text-[#797168]',
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
