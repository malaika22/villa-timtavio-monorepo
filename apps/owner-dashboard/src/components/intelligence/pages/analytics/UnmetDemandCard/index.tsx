'use client';

import { TrendingDown } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useUnmetDemand } from '@/hooks/useAnalytics';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const UnmetDemandCard = () => {
  const { data, isLoading } = useUnmetDemand();
  const items = data?.items ?? [];

  return (
    <IntelCard className="flex flex-col p-5">
      <h3 className="mb-1 flex items-center gap-1.5 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        <TrendingDown className="size-4 text-[#a64b4b]" />
        Unmet Demand
      </h3>
      <p className="mb-3 text-xs text-intel-text-muted">
        Inquiries during fully-booked windows that never converted.
      </p>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-intel-text-muted">
          No unmet demand — every inquiry could be accommodated.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-baseline gap-4">
            <div>
              <span className="font-cormorant text-[30px] leading-none text-[#a64b4b]">
                {data!.count}
              </span>
              <span className="ml-1 text-xs text-intel-text-muted">
                missed {data!.count === 1 ? 'stay' : 'stays'}
              </span>
            </div>
            <div>
              <span className="font-cormorant text-[30px] leading-none text-intel-text">
                {money(data!.estimatedLostRevenue)}
              </span>
              <span className="ml-1 text-xs text-intel-text-muted">est. lost</span>
            </div>
          </div>
          <ul className="divide-y divide-[#f1ece4]">
            {items.slice(0, 6).map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span className="text-intel-text">
                  {it.from} → {it.to}
                  {it.guestCount ? (
                    <span className="text-intel-text-muted">
                      {' '}
                      · {it.guestCount} guests
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums text-intel-text-muted">
                  {money(it.estimatedRevenue)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </IntelCard>
  );
};
