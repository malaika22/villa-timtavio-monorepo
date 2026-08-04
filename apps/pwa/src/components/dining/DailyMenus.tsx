'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Clock } from 'lucide-react';
import type { DailyMenu, DiningRequest, MenuCategory } from '@repo/api-types';
import { cn } from '@repo/ui/lib/utils';

import { DishThumb } from './DishThumb';

/** Read in the order they're eaten, not the order the enum happens to be in. */
const MEAL_ORDER: MenuCategory[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

/** ISO date only — the key the API groups services by. */
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function daysBetween(from: string, to: string): Date[] {
  const start = new Date(`${from.slice(0, 10)}T00:00:00.000Z`);
  const end = new Date(`${to.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const out: Date[] = [];
  for (
    let d = start;
    d <= end && out.length < 60;
    d = new Date(d.getTime() + 86400000)
  ) {
    out.push(d);
  }
  return out;
}

/**
 * What the kitchen is cooking, day by day.
 *
 * Replaces an undated catalogue: every active dish used to be shown to every
 * guest on every day of their stay, including ones the kitchen stopped making
 * months ago. Only published services appear — the API excludes drafts, so a
 * half-decided Thursday can't leak through.
 */
export const DailyMenus = ({
  menus,
  checkIn,
  checkOut,
  sittings = [],
  onFlagLate,
  flaggedLate,
}: {
  menus: DailyMenu[];
  checkIn: string;
  checkOut: string;
  /**
   * The party's sittings. They live inside the day they belong to rather than
   * in a list of their own: a week's stay is twenty-one sittings, and a
   * separate list duplicated the day strip that already sits right here.
   * Beside the meal it also answers the question a guest actually has —
   * what time, and what's for dinner.
   */
  sittings?: DiningRequest[];
  onFlagLate?: (sitting: DiningRequest) => void;
  flaggedLate?: (sitting: DiningRequest) => boolean;
}) => {
  const days = useMemo(
    () => daysBetween(checkIn, checkOut),
    [checkIn, checkOut],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, DailyMenu[]>();
    for (const menu of menus) {
      const key = menu.date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), menu]);
    }
    return map;
  }, [menus]);

  // Open on today when the guest is in-stay, otherwise on the first day they
  // arrive — which is what someone planning from home came to look at.
  const [selected, setSelected] = useState<string>(() => {
    const today = dayKey(new Date());
    const inStay = days.some((d) => dayKey(d) === today);
    return inStay ? today : days[0] ? dayKey(days[0]) : today;
  });

  if (days.length === 0) return null;

  const sittingFor = (mealType: MenuCategory) =>
    sittings.find(
      (r) =>
        r.mealType === mealType && (r.date ?? '').slice(0, 10) === selected,
    );

  const forDay = (byDay.get(selected) ?? [])
    .slice()
    .sort(
      (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType),
    );

  return (
    <section className="mb-6">
      <p className="mb-2 text-[8px] uppercase tracking-[2.5px] text-[#9A9288]">
        The kitchen
      </p>

      <div className="-mx-3 mb-3 flex gap-1.5 overflow-x-auto px-3 pb-1">
        {days.map((day) => {
          const key = dayKey(day);
          const isOn = key === selected;
          const planned = (byDay.get(key) ?? []).length > 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
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
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'mt-0.5 text-[12px] tabular-nums',
                  isOn ? 'text-[#F2E7D2]' : 'text-[#2B2824]',
                )}
              >
                {format(day, 'd')}
              </span>
              {/* A dot for a day with something to read. Nothing shouts. */}
              <span
                className={cn(
                  'mt-1 block size-[3px] rounded-full',
                  planned
                    ? isOn
                      ? 'bg-[#DCC391]'
                      : 'bg-[#B08D57]'
                    : 'bg-[#E3E0DA]',
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {forDay.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#C9C4BC] bg-[#F7F5F2] px-4 py-7 text-center">
          <p className="text-[11.5px] text-[#2B2824]">
            Your chef is still planning this one
          </p>
          <p className="mt-1 text-[9.5px] leading-relaxed text-[#797168]">
            {format(parseISO(selected), 'EEEE')}&rsquo;s menu will appear here
            closer to the day. You can still reserve a sitting now.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {forDay.map((menu) => (
            <div
              key={menu.id}
              className="overflow-hidden rounded-[12px] border border-[#E3E0DA] bg-white"
            >
              <div className="flex items-baseline justify-between gap-2 border-b border-[#E3E0DA] bg-[#F7F5F2] px-3.5 py-2">
                <p className="font-cormorant text-[14px] text-[#2B2824]">
                  {MEAL_LABEL[menu.mealType] ?? menu.mealType}
                </p>
                {sittingFor(menu.mealType)?.time && (
                  <p className="text-[10px] tabular-nums text-[#2B2824]">
                    {sittingFor(menu.mealType)!.time}
                  </p>
                )}
              </div>

              {(() => {
                const sitting = sittingFor(menu.mealType);
                if (!sitting) return null;
                const isLate = flaggedLate?.(sitting) ?? false;
                return (
                  <div className="flex items-center justify-between gap-2 border-b border-[#F0EDE6] bg-[#FBF3DF] px-3.5 py-2">
                    <span className="text-[9.5px] text-[#8A6D3B]">
                      {isLate
                        ? 'You’ll be arriving late'
                        : `Your table is set for ${sitting.time ?? 'this service'}`}
                    </span>
                    {onFlagLate && !isLate && (
                      <button
                        type="button"
                        onClick={() => onFlagLate(sitting)}
                        className="flex shrink-0 items-center gap-1 rounded-full border border-[#8A6D3B] px-2 py-0.5 text-[9px] text-[#8A6D3B]"
                      >
                        <Clock className="size-2.5" aria-hidden />
                        I’ll be late
                      </button>
                    )}
                    {isLate && (
                      <Check
                        className="size-3 shrink-0 text-[#3A5E48]"
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })()}

              {menu.note && (
                <p className="border-b border-[#F0EDE6] bg-[#FBF3DF] px-3.5 py-2 text-[10px] italic leading-snug text-[#8A6D3B]">
                  {menu.note}
                </p>
              )}

              <ul>
                {menu.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-2.5 border-b border-[#F0EDE6] px-3.5 py-2.5 last:border-b-0"
                  >
                    <DishThumb
                      photoUrl={item.menuItem.photoUrl}
                      name={item.menuItem.name}
                      className="!size-11 !rounded-[8px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] text-[#2B2824]">
                        {item.menuItem.name}
                      </span>
                      {item.menuItem.description && (
                        <span className="mt-0.5 block text-[9.5px] leading-snug text-[#797168]">
                          {item.menuItem.description}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
