'use client';
import { Fragment, useMemo, useState } from 'react';
import { Star, ChevronDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { experiencePerformanceRows } from '@/lib/mock-data';
import type { ExperiencePerformanceRow } from '@/types';
import { useCatalogAsPerformanceRows } from '@/hooks/useCatalog';
import {
  COLUMNS,
  DECLINED_HIGH,
  DECLINED_LOW,
  MUTED_GREY,
  RATING_GOLD,
} from './constants';

const declinedColor = (row: ExperiencePerformanceRow) => {
  if (row.declined === 0 || row.declinedPercent < 10) return DECLINED_LOW;
  return DECLINED_HIGH;
};

const cellBorder = 'border-r border-intel-border last:border-r-0';

type SortKey = 'Bookings' | 'Avg Rating' | 'Declined' | null;
const SORTABLE: Record<string, (r: ExperiencePerformanceRow) => number> = {
  Bookings: (r) => r.bookings,
  'Avg Rating': (r) => r.rating,
  Declined: (r) => r.declinedPercent,
};

const parseRevenue = (s: string) => Number(String(s).replace(/[^0-9.]/g, '')) || 0;

export const ExperiencePerformanceTable = () => {
  const { data: apiRows } = useCatalogAsPerformanceRows();
  const baseRows: ExperiencePerformanceRow[] =
    apiRows ?? experiencePerformanceRows;

  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!sortKey) return baseRows;
    const accessor = SORTABLE[sortKey];
    return [...baseRows].sort((a, b) =>
      sortDir === 'desc' ? accessor(b) - accessor(a) : accessor(a) - accessor(b),
    );
  }, [baseRows, sortKey, sortDir]);

  const onSort = (col: string) => {
    if (!SORTABLE[col]) return;
    if (sortKey === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(col as SortKey);
      setSortDir('desc');
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <h3 className="mb-3 shrink-0 text-center font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Experience Performance — YTD 2026
      </h3>
      <IntelCard
        padding={false}
        className="flex flex-1 flex-col overflow-hidden rounded-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-intel-border bg-[#f9f9f9]">
                {COLUMNS.map((col) => {
                  const sortable = !!SORTABLE[col];
                  return (
                    <th
                      key={col}
                      onClick={() => onSort(col)}
                      className={cn(
                        'px-4 py-3 text-left text-[10px] font-medium tracking-[0.12em] text-intel-text-muted uppercase',
                        cellBorder,
                        sortable && 'cursor-pointer select-none hover:text-intel-text',
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col}
                        {sortable ? (
                          sortKey === col ? (
                            <ChevronDown
                              className={cn(
                                'size-3 transition-transform',
                                sortDir === 'asc' && 'rotate-180',
                              )}
                            />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <Fragment key={row.id}>
                <tr
                  onClick={() =>
                    setExpanded(expanded === row.id ? null : row.id)
                  }
                  className={cn(
                    'cursor-pointer border-b border-intel-border last:border-0 hover:bg-[#f5f1ec]',
                    i % 2 === 1 && 'bg-[#faf9f7]',
                  )}
                >
                  <td
                    className={cn(
                      'px-4 py-3 font-semibold text-intel-text',
                      cellBorder,
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ChevronDown
                        className={cn(
                          'size-3 text-intel-text-muted transition-transform',
                          expanded === row.id && 'rotate-180',
                        )}
                      />
                      {row.name}
                    </span>
                  </td>
                  <td
                    className={cn('px-4 py-3 tabular-nums', cellBorder)}
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
                    className={cn(
                      'px-4 py-3 font-medium tabular-nums',
                      cellBorder,
                    )}
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
                {expanded === row.id ? (
                  <tr key={`${row.id}-detail`} className="bg-[#faf8f4]">
                    <td colSpan={COLUMNS.length} className="px-4 py-3">
                      <div className="flex flex-wrap gap-6 text-xs text-intel-text-muted">
                        <span>
                          Revenue / booking:{' '}
                          <span className="font-medium text-intel-text">
                            $
                            {row.bookings > 0
                              ? Math.round(
                                  parseRevenue(row.revenue) / row.bookings,
                                ).toLocaleString()
                              : 0}
                          </span>
                        </span>
                        <span>
                          Decline rate:{' '}
                          <span className="font-medium text-intel-text">
                            {row.declinedPercent}%
                          </span>
                        </span>
                        <span>
                          Trend:{' '}
                          <span className="font-medium text-intel-text">
                            {row.trendDirection} {row.trend}
                          </span>
                        </span>
                        <span>
                          Rating:{' '}
                          <span className="font-medium text-intel-text">
                            {row.rating.toFixed(1)} / 5
                          </span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </IntelCard>
    </section>
  );
};
