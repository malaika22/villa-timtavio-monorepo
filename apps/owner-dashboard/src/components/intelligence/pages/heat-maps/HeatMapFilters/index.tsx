'use client';

import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';

const timeFilters = ['Today', 'This Week', 'This Month', 'Custom'] as const;

// These four are the only serviceType values a ServiceEvent can currently
// carry, because the sole writer of ServiceEvents is prisma/seed-service-events.
// Adding the remaining CatalogCategory values (ARRIVAL_TRANSIT, EXCURSIONS,
// INCLUDED) would add filters that can only ever return nothing. Revisit when
// experience activity actually emits ServiceEvents — see the parked heat-map
// work — and source this list from the estate's real categories then.
const categoryFilters: { label: string; value?: string }[] = [
  { label: 'All Activity', value: undefined },
  { label: 'Wellness', value: 'WELLNESS' },
  { label: 'Culinary', value: 'CULINARY_AGAVE' },
  { label: 'Ocean', value: 'OCEAN_ADVENTURE' },
  { label: 'Private', value: 'PRIVATE' },
];

export const HeatMapFilters = ({
  category,
  onCategoryChange,
}: {
  category?: string;
  onCategoryChange?: (value?: string) => void;
}) => {
  const [time, setTime] = useState<(typeof timeFilters)[number]>('Today');
  const now = new Date();

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
            {categoryFilters.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => onCategoryChange?.(c.value)}
                className={cn(
                  'rounded px-2.5 py-1.5 text-xs transition-colors',
                  category === c.value
                    ? 'bg-intel-maroon text-white'
                    : 'text-intel-text-muted hover:text-intel-text',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Derived — a frozen timestamp on a page titled "Real-time activity
          density" misreports the very thing the page is about. */}
      <p className="shrink-0 text-[11px] text-intel-text-muted sm:text-xs">
        {now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}{' '}
        ·{' '}
        {now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
};
