import { cn } from '@repo/ui/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { MONTH_NAMES } from '../RequestExperienceSheet/constants';

export function CalenderPicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());

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
          const selected = isSelectedCell(day);
          const isToday = isTodayCell(day);

          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              <button
                type="button"
                disabled={past}
                onClick={() =>
                  onSelect(new Date(displayYear, displayMonth, day))
                }
                className={cn(
                  'relative flex size-8 items-center justify-center rounded-full text-[13px] transition-colors',
                  selected && 'bg-[#181818] text-white',
                  !selected && !past && 'text-[#2B2824] hover:bg-[#F5F3F0]',
                  past && 'cursor-not-allowed text-[#D0CBC3]',
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
