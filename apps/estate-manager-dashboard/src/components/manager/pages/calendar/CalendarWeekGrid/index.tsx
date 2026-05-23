import { cn } from '@repo/ui/lib/utils';

import { calendarEventStyles } from '@/components/manager/pages/calendar/calendar-event-styles';
import {
  calendarTimelineEvents,
  calendarVillas,
  calendarWeekDays,
} from '@/lib/calendar-mock-data';
import type { CalendarTimelineEvent } from '@/types';

const GRID_COLS = 'minmax(96px, 112px) repeat(7, minmax(0, 1fr))';

function VillaTimelineRow({
  villaIndex,
  events,
}: {
  villaIndex: number;
  events: CalendarTimelineEvent[];
}) {
  return (
    <div
      className="grid border-b border-[#ebe6df] last:border-b-0"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      <div className="flex items-center border-r border-[#ebe6df] bg-[#faf9f7] px-3 py-4">
        <span className="font-inter text-base font-medium text-manager-text">
          {calendarVillas[villaIndex]}
        </span>
      </div>

      <div className="relative col-span-7 min-h-[88px] py-2.5">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-7" aria-hidden>
          {calendarWeekDays.map((day, i) => (
            <div
              key={day.key}
              className={cn('border-r border-[#ebe6df]', i === 6 && 'border-r-0')}
            />
          ))}
        </div>

        <div className="relative grid h-full grid-cols-7 grid-rows-2 gap-y-1">
          {events.map((event) => (
            <div
              key={event.id}
              className={cn(
                'font-inter z-10 mx-1 flex items-center truncate rounded-md px-2.5 py-2 text-sm font-medium',
                calendarEventStyles[event.type].pill,
                event.lane === 1 ? 'row-start-2 self-start' : 'row-start-1 self-center',
              )}
              style={{
                gridColumn: `${event.startDay + 1} / span ${event.span}`,
              }}
            >
              {event.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const CalendarWeekGrid = () => {
  const eventsByVilla = calendarVillas.map((_, villaIndex) =>
    calendarTimelineEvents.filter((e) => e.villa === villaIndex + 1),
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px] overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
        <div
          className="grid border-b border-[#ebe6df] bg-[#faf9f7]"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <div className="border-r border-[#ebe6df]" aria-hidden />
          {calendarWeekDays.map((day, i) => (
            <div
              key={day.key}
              className={cn(
                'border-r border-[#ebe6df] px-2 py-3.5 text-center',
                i === 6 && 'border-r-0',
              )}
            >
              <p className="font-inter text-[11px] font-medium tracking-[0.12em] text-manager-text-muted uppercase">
                {day.weekday}
              </p>
              <p className="font-cormorant mt-1 text-xl leading-tight text-manager-text">
                {day.dateLabel}
              </p>
            </div>
          ))}
        </div>

        {eventsByVilla.map((events, index) => (
          <VillaTimelineRow key={calendarVillas[index]} villaIndex={index} events={events} />
        ))}
      </div>
    </div>
  );
};
