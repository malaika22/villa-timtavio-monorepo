'use client';

import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { CalendarX } from 'lucide-react';
import Link from 'next/link';

import { useDailyMenuGaps } from '@/hooks/useDailyMenus';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
};

/** Beyond this the list stops being a prompt and becomes a wall. */
const MAX_LISTED = 3;

/**
 * Days in the next week with nothing published.
 *
 * The failure mode daily menus introduced is silence: if nobody plans, guests
 * see "your chef is still planning this one" every day and quietly get less
 * than they did before the feature existed — with nothing anywhere saying so.
 * This is the only thing that says so.
 */
export const MenuGapsBanner = () => {
  const { data } = useDailyMenuGaps(7);
  const gaps = data?.gaps ?? [];
  if (gaps.length === 0) return null;

  const shown = gaps.slice(0, MAX_LISTED);
  const today = new Date();

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
      <div className="flex items-start gap-2">
        <CalendarX className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-amber-900">
            {gaps.length} day{gaps.length === 1 ? '' : 's'} in the next week
            {gaps.length === 1 ? ' has' : ' have'} no published menu
          </h2>
          <p className="mt-0.5 text-sm text-amber-800/80">
            Guests looking at those days are told the chef is still planning.
          </p>

          <ul className="mt-2 flex flex-col gap-0.5">
            {shown.map((gap) => {
              const day = parseISO(gap.date);
              const away = differenceInCalendarDays(day, today);
              return (
                <li key={gap.date} className="text-xs text-amber-900">
                  <span className="font-medium">
                    {away === 0
                      ? 'Today'
                      : away === 1
                        ? 'Tomorrow'
                        : format(day, 'EEEE d MMM')}
                  </span>
                  {' — no '}
                  {gap.missing
                    .map((m) => MEAL_LABEL[m] ?? m.toLowerCase())
                    .join(', ')}
                </li>
              );
            })}
            {gaps.length > MAX_LISTED && (
              <li className="text-xs text-amber-800/80">
                and {gaps.length - MAX_LISTED} more
              </li>
            )}
          </ul>

          <Link
            href="/menu"
            className="mt-2 inline-block text-xs font-medium text-amber-900 underline underline-offset-2"
          >
            Plan the week
          </Link>
        </div>
      </div>
    </section>
  );
};
