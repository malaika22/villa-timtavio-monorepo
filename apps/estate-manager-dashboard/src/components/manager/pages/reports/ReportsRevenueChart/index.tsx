'use client';

import { useState } from 'react';
import { cn } from '@repo/ui/lib/utils';

import {
  reportsRevenue2025,
  reportsRevenue2026,
  type ReportsRevenueMonth,
} from '@/lib/reports-mock-data';

const MAX_BAR_HEIGHT = 160;

function YearToggle({
  year,
  active,
  onClick,
}: {
  year: '2026' | '2025';
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'font-inter rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-manager-accent text-white' : 'text-[#707070] hover:text-manager-text',
      )}
    >
      {year}
    </button>
  );
}

function RevenueBars({ data }: { data: ReportsRevenueMonth[] }) {
  const max = Math.max(...data.map((d) => d.valueK));

  return (
    <div className="mt-6 flex items-end justify-between gap-1 sm:gap-2">
      {data.map((row) => {
        const height = Math.round((row.valueK / max) * MAX_BAR_HEIGHT);
        return (
          <div key={row.month} className="flex min-w-0 flex-1 flex-col items-center">
            <span className="font-inter mb-2 text-[11px] font-medium text-manager-text-muted">
              {row.label}
            </span>
            <div
              className={cn(
                'w-full max-w-[44px] rounded-t-sm',
                row.highlight ? 'bg-manager-accent' : 'bg-[#e8ddd4]',
              )}
              style={{ height: `${Math.max(height, 8)}px` }}
              title={row.label}
            />
            <span className="font-inter mt-2 text-xs text-manager-text-muted">{row.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export const ReportsRevenueChart = () => {
  const [year, setYear] = useState<'2026' | '2025'>('2026');
  const data = year === '2026' ? reportsRevenue2026 : reportsRevenue2025;

  return (
    <section className="rounded-xl border border-[#e8e4de] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="font-cormorant text-[22px] leading-tight text-manager-text">
          Revenue by Month — {year}
        </h3>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-manager-border bg-manager-card p-1">
          <YearToggle year="2026" active={year === '2026'} onClick={() => setYear('2026')} />
          <YearToggle year="2025" active={year === '2025'} onClick={() => setYear('2025')} />
        </div>
      </div>

      <RevenueBars data={data} />

      <p className="font-inter mt-4 text-sm italic text-manager-text-muted">
        Monthly revenue in USD thousands · March highlighted
      </p>
    </section>
  );
};
