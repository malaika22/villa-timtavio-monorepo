'use client';

import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Tag } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { formatRateRange } from '@repo/api-types';

import { useNeedsPricing } from '@/hooks/useApprovals';

/** Same window the setup task is raised in — past this, staff are being booked. */
const URGENT_WITHIN_DAYS = 3;

/**
 * What still needs a price before it happens, soonest first.
 *
 * Pricing now happens whenever the supplier commits, which can be months after
 * the guest asked — so the work is scheduled by the experience's own date, and
 * nothing else in the dashboard answers "what must I price this week?".
 *
 * Left unpriced, the setup task is never raised and staff are never assigned:
 * the guest arrives expecting something nobody prepared.
 */
export const NeedsPricingPanel = () => {
  const { data: requests = [] } = useNeedsPricing();

  if (requests.length === 0) return null;

  return (
    <section className="mb-5 rounded-xl border border-manager-border bg-manager-card p-5">
      <div className="flex items-start gap-2">
        <Tag className="mt-0.5 size-4 shrink-0 text-manager-accent" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-manager-text">
            {requests.length} experience{requests.length === 1 ? '' : 's'} need a
            price
          </h2>
          <p className="mt-0.5 text-sm text-manager-text-muted">
            Confirmed with the guest but not yet costed. No setup task is raised
            until a price is agreed, so these need a figure before the date.
          </p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-manager-border">
        {requests.map((r) => {
          const when = r.confirmedDate ? parseISO(r.confirmedDate) : null;
          const daysAway = when ? differenceInCalendarDays(when, new Date()) : null;
          const urgent = daysAway != null && daysAway <= URGENT_WITHIN_DAYS;

          return (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 text-sm"
            >
              <span
                className={cn(
                  'w-20 shrink-0 font-medium tabular-nums',
                  urgent ? 'text-[#b42318]' : 'text-manager-text',
                )}
              >
                {when ? format(when, 'MMM d') : '—'}
              </span>
              <span className="min-w-0 flex-1 text-manager-text">
                {r.catalogItem?.name ?? 'Experience'}
                <span className="text-manager-text-muted">
                  {' · '}
                  {r.requestedByName}
                </span>
              </span>
              {/* The figure is the reason this row exists — it was rendering
                  smaller and fainter than everything beside it. */}
              <span className="text-sm font-medium tabular-nums text-manager-text">
                {r.estimatedMin != null
                  ? formatRateRange(r.estimatedMin, r.estimatedMax)
                  : '—'}
                <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-manager-text-muted">
                  {r.estimatedMin != null ? 'est.' : 'no estimate'}
                </span>
              </span>
              {urgent && (
                <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#b42318]">
                  {daysAway! <= 0
                    ? 'Today'
                    : `${daysAway} day${daysAway === 1 ? '' : 's'}`}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-manager-text-muted">
        Price each from its row in the queue below.
      </p>
    </section>
  );
};
