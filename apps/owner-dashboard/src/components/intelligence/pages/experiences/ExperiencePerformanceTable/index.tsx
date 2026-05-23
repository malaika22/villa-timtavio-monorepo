import { Star } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { experiencePerformanceRows } from '@/lib/mock-data';
import type { ExperiencePerformanceRow } from '@/types';

const COLUMNS = ['Experience', 'Bookings', 'Revenue', 'Avg Rating', 'Declined', 'Trend'] as const;

const RATING_GOLD = '#c5a070';
const DECLINED_HIGH = '#a64b4b';
const DECLINED_LOW = '#6b8e6b';
const MUTED_GREY = '#8e8e8e';

const declinedColor = (row: ExperiencePerformanceRow) => {
  if (row.declined === 0 || row.declinedPercent < 10) return DECLINED_LOW;
  return DECLINED_HIGH;
};

const cellBorder = 'border-r border-intel-border last:border-r-0';

export const ExperiencePerformanceTable = () => (
  <section className="flex h-full min-h-0 flex-col">
    <h3 className="mb-3 shrink-0 text-center font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      Experience Performance — YTD 2026
    </h3>
    <IntelCard padding={false} className="flex flex-1 flex-col overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-intel-border bg-[#f9f9f9]">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className={cn(
                    'px-4 py-3 text-left text-[10px] font-medium tracking-[0.12em] text-intel-text-muted uppercase',
                    cellBorder,
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experiencePerformanceRows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-intel-border last:border-0',
                  i % 2 === 1 && 'bg-[#faf9f7]',
                )}
              >
                <td
                  className={cn(
                    'px-4 py-3 font-semibold text-intel-text',
                    cellBorder,
                  )}
                >
                  {row.name}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 tabular-nums',
                    cellBorder,
                  )}
                  style={{ color: MUTED_GREY }}
                >
                  {row.bookings}
                </td>
                <td
                  className={cn('px-4 py-3 tabular-nums', cellBorder)}
                  style={{ color: MUTED_GREY }}
                >
                  {row.revenue}
                </td>
                <td className={cn('px-4 py-3', cellBorder)}>
                  <span
                    className="inline-flex items-center gap-1 tabular-nums"
                    style={{ color: RATING_GOLD }}
                  >
                    <Star
                      className="size-3.5"
                      style={{ fill: RATING_GOLD, color: RATING_GOLD }}
                    />
                    {row.rating.toFixed(1)}
                  </span>
                </td>
                <td
                  className={cn('px-4 py-3 font-medium tabular-nums', cellBorder)}
                  style={{ color: declinedColor(row) }}
                >
                  {row.declined === 0
                    ? '0'
                    : `${row.declined} (${row.declinedPercent}%)`}
                </td>
                <td className="px-4 py-3 font-medium tabular-nums text-intel-text">
                  {row.trend}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IntelCard>
  </section>
);
