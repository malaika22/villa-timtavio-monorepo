import { cn } from '@repo/ui/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { MONTH_NAMES } from '../RequestExperienceSheet/constants';

/** Local midnight for an ISO date, so a timezone can't shift the day. */
function dayStart(iso?: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function CalenderPicker({
  selectedDate,
  onSelect,
  checkIn,
  checkOut,
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  /**
   * The stay. Without it the picker offered every day of the month, so a guest
   * could book a massage for a day they aren't at the villa — the estate would
   * commit a therapist and nobody would notice until the date.
   */
  checkIn?: string | null;
  checkOut?: string | null;
}) {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const stayStart = dayStart(checkIn);
  const stayEnd = dayStart(checkOut);

  // Open on the stay when it hasn't begun — a guest planning in August for a
  // September stay shouldn't land on August and have to page forward.
  const initial = stayStart && stayStart > todayStart ? stayStart : today;
  const [displayYear, setDisplayYear] = useState(initial.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(initial.getMonth());

  const firstWeekday = new Date(displayYear, displayMonth, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((y) => y - 1);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((y) => y + 1);
    } else {
      setDisplayMonth((m) => m + 1);
    }
  };

  const isTodayCell = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === displayMonth &&
    today.getFullYear() === displayYear;

  const isSelectedCell = (day: number) =>
    selectedDate !== null &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === displayMonth &&
    selectedDate.getFullYear() === displayYear;

  const isPastCell = (day: number) =>
    new Date(displayYear, displayMonth, day) < todayStart;

  return (
    <div className="rounded-xl border border-[#E3E0DA] bg-white px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-cormorant text-[18px] font-medium text-[#2B2824]">
          {MONTH_NAMES[displayMonth]} {displayYear}
        </span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 text-[#797168] transition-colors hover:text-[#2B2824]"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 text-[#797168] transition-colors hover:text-[#2B2824]"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-[10px] font-medium tracking-[1px] text-[#B0AAA0]"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const past = isPastCell(day);
          const cellDate = new Date(displayYear, displayMonth, day);
          // Outside the stay is as unbookable as the past — the estate can't
          // serve a guest who isn't here.
          const outsideStay =
            (!!stayStart && cellDate < stayStart) ||
            (!!stayEnd && cellDate > stayEnd);
          const unavailable = past || outsideStay;
          const selected = isSelectedCell(day);
          const isToday = isTodayCell(day);

          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              <button
                type="button"
                disabled={unavailable}
                title={
                  outsideStay && !past
                    ? 'Outside your stay'
                    : undefined
                }
                onClick={() =>
                  onSelect(new Date(displayYear, displayMonth, day))
                }
                className={cn(
                  'relative flex size-8 items-center justify-center rounded-full text-[13px] transition-colors',
                  selected && 'bg-[#181818] text-white',
                  !selected &&
                    !unavailable &&
                    'text-[#2B2824] hover:bg-[#F5F3F0]',
                  unavailable && 'cursor-not-allowed text-[#D0CBC3]',
                )}
              >
                {day}
                {isToday && !selected && (
                  <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[#181818]" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
