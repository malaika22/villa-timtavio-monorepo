'use client';

import Link from 'next/link';
import { Grid3x3, Star, PiggyBank, ArrowRight } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import {
  useExperiencePerformance,
  useEquipmentAnalysis,
} from '@/hooks/useAnalytics';
import { usePeriod } from '@/providers/period-provider';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const OverviewTeasers = () => {
  const { period } = usePeriod();
  const { data: perfRows } = useExperiencePerformance(period);
  const { data: equipment } = useEquipmentAnalysis();

  const top3 = [...(perfRows ?? [])]
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 3);
  const savings = equipment?.totalProjectedSavings ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Top experiences */}
      <IntelCard className="flex flex-col p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-intel-text">
          <Star className="size-4 text-[#c5a070]" />
          Top Experiences
        </h3>
        {top3.length === 0 ? (
          <p className="text-xs text-intel-text-muted">No data yet.</p>
        ) : (
          <ol className="space-y-1.5">
            {top3.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate text-intel-text">
                  <span className="mr-1.5 text-intel-text-muted">{i + 1}.</span>
                  {r.name}
                </span>
                <span className="shrink-0 text-intel-text-muted">
                  {r.bookings} bk
                </span>
              </li>
            ))}
          </ol>
        )}
        <Link
          href="/experiences"
          className="mt-auto inline-flex items-center gap-1 pt-2 text-xs text-intel-maroon hover:underline"
        >
          All experiences <ArrowRight className="size-3" />
        </Link>
      </IntelCard>

      {/* Capital alert */}
      <IntelCard className="flex flex-col p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-intel-text">
          <PiggyBank className="size-4 text-[#2f8f6b]" />
          Capital Opportunity
        </h3>
        <p className="font-cormorant text-[30px] leading-none text-[#2f8f6b]">
          {money(savings)}
        </p>
        <p className="mt-1 text-xs text-intel-text-muted">
          Projected 2-year savings from buy-vs-rent recommendations.
        </p>
        <Link
          href="/capital-insights"
          className="mt-auto inline-flex items-center gap-1 pt-2 text-xs text-intel-maroon hover:underline"
        >
          Review equipment <ArrowRight className="size-3" />
        </Link>
      </IntelCard>

      {/* Heat-map teaser */}
      <IntelCard className="flex flex-col p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-intel-text">
          <Grid3x3 className="size-4 text-[#c2922d]" />
          Service Heat Map
        </h3>
        <div className="relative grid flex-1 grid-cols-6 gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="aspect-square rounded-[2px] bg-[#f0ede8]"
            />
          ))}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-intel-text-muted">
            No activity yet
          </span>
        </div>
        <Link
          href="/heat-maps"
          className="mt-2 inline-flex items-center gap-1 text-xs text-intel-maroon hover:underline"
        >
          View full heat maps <ArrowRight className="size-3" />
        </Link>
      </IntelCard>
    </div>
  );
};
