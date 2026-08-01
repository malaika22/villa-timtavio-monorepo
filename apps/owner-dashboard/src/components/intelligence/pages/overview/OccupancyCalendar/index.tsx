'use client';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useOccupancyCalendar } from '@/hooks/useAnalytics';

const MAX_GUESTS = 16;

function color(guests: number): string {
  if (guests <= 0) return '#f7f4ef';
  const t = Math.min(1, guests / MAX_GUESTS);
  const r = Math.round(247 + (123 - 247) * t);
  const g = Math.round(244 + (67 - 244) * t);
  const b = Math.round(239 + (67 - 239) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export const OccupancyCalendar = () => {
  const { data = [], isLoading } = useOccupancyCalendar();

  return (
    <IntelCard className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
          Occupancy — Next 30 Days
        </h3>
        <span className="text-xs text-intel-text-muted">
          {data.filter((d) => d.occupied).length} booked days
        </span>
      </div>

      {/* The grid reflows rather than forcing 10 columns — a fixed 10-wide
          layout pushed the whole page sideways on a phone and clipped the
          first column. */}
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : (
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {data.map((d) => (
            <div
              key={d.date}
              className="flex aspect-square flex-col items-center justify-center rounded-[4px] border border-[#efe9e0] text-[9px]"
              style={{ background: color(d.guests) }}
              title={`${d.date}: ${d.guests} guests · ${d.bookings} booking(s)`}
            >
              <span className="font-medium text-[#5a514a]">
                {Number(d.date.slice(8, 10))}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-intel-text-muted">
        Empty
        <span className="flex">
          {[0, 4, 8, 12, 16].map((g) => (
            <span key={g} className="size-3" style={{ background: color(g) }} />
          ))}
        </span>
        Full
      </div>
    </IntelCard>
  );
};
