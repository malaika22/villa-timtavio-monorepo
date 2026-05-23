'use client';

import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';

const timeFilters = ['Today', 'This Week', 'This Month', 'Custom'] as const;
const categoryFilters = ['All Activity', 'Experiences', 'Staff', 'Arrivals'] as const;

export const HeatMapFilters = () => {
  const [time, setTime] = useState<(typeof timeFilters)[number]>('Today');
  const [category, setCategory] = useState<(typeof categoryFilters)[number]>('All Activity');

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-intel-border bg-intel-card p-0.5 shadow-[0_1px_2px_rgba(26,22,20,0.04)]">
          {timeFilters.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setTime(label)}
              className={cn(
                'rounded px-2.5 py-1.5 text-xs transition-colors',
                time === label
                  ? 'bg-intel-maroon text-white'
                  : 'text-intel-text-muted hover:text-intel-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-intel-text-muted">Category:</span>
          <div className="inline-flex rounded-md border border-intel-border bg-intel-card p-0.5 shadow-[0_1px_2px_rgba(26,22,20,0.04)]">
            {categoryFilters.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setCategory(label)}
                className={cn(
                  'rounded px-2.5 py-1.5 text-xs transition-colors',
                  category === label
                    ? 'bg-intel-maroon text-white'
                    : 'text-intel-text-muted hover:text-intel-text',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="shrink-0 text-[11px] text-intel-text-muted sm:text-xs">
        Friday, March 27 - 2:00 PM
      </p>
    </div>
  );
};
