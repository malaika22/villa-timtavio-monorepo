'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { cn } from '@repo/ui/lib/utils';

import { CalendarLegend } from '@/components/manager/pages/calendar/CalendarLegend';
import { calendarEventStyles } from '@/components/manager/pages/calendar/calendar-event-styles';
import { useCalendar } from '@/hooks/useCalendar';

function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export const CalendarPage = () => {
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined);
  const { data, isLoading } = useCalendar(weekStart);

  const days = data?.days ?? [];
  const rangeLabel =
    days.length === 7
      ? `${format(parseISO(days[0].date), 'MMM d')} – ${format(parseISO(days[6].date), 'MMM d, yyyy')}`
      : '';

  const shiftWeek = (delta: number) => {
    const anchor = data ? parseISO(data.weekStart) : new Date();
    setWeekStart(toISODate(addDays(anchor, delta * 7)));
  };

  const todayKey = toISODate(new Date());

  return (
    <div className="font-inter space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftWeek(-1)}
            className="flex size-8 items-center justify-center rounded-md border border-manager-border bg-white text-manager-text-muted hover:bg-[#faf9f7]"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setWeekStart(undefined)}
            className="rounded-md border border-manager-border bg-white px-3 py-1.5 text-xs font-medium text-manager-text hover:bg-[#faf9f7]"
          >
            Today
          </button>
          <button
            onClick={() => shiftWeek(1)}
            className="flex size-8 items-center justify-center rounded-md border border-manager-border bg-white text-manager-text-muted hover:bg-[#faf9f7]"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
          <span className="ml-2 text-sm font-medium text-manager-text">
            {rangeLabel}
          </span>
        </div>
        <CalendarLegend />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg bg-manager-border"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
          {days.map((day) => {
            const date = parseISO(day.date);
            const isToday = toISODate(date) === todayKey;
            return (
              <div
                key={day.date}
                className={cn(
                  'min-h-[180px] rounded-lg border bg-white p-2',
                  isToday ? 'border-[#c4a882]' : 'border-manager-border',
                )}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-manager-text-muted">
                    {format(date, 'EEE')}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isToday ? 'text-[#c4a882]' : 'text-manager-text',
                    )}
                  >
                    {format(date, 'd')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {day.events.length === 0 ? (
                    <p className="px-1 py-2 text-[11px] text-manager-text-muted">
                      —
                    </p>
                  ) : (
                    day.events.map((e) => (
                      <div
                        key={e.id}
                        className={cn(
                          'rounded-md px-2 py-1.5 text-[11px] font-medium leading-snug',
                          calendarEventStyles[e.type].pill,
                        )}
                        title={e.label}
                      >
                        {e.time ? (
                          <span className="opacity-70">{e.time} · </span>
                        ) : null}
                        {e.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
