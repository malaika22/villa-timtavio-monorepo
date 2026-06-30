'use client';

import Link from 'next/link';
import { Grid3x3, Star, PiggyBank, ArrowRight } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useCatalogAsPerformanceRows } from '@/hooks/useCatalog';
import { useEquipmentAnalysis } from '@/hooks/useAnalytics';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const OverviewTeasers = () => {
  const { data: perfRows } = useCatalogAsPerformanceRows();
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
        <div className="grid flex-1 grid-cols-6 gap-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const t = (Math.sin(i * 1.3) + 1) / 2;
            const r = Math.round(247 + (194 - 247) * t);
            const g = Math.round(244 + (146 - 244) * t);
            const b = Math.round(239 + (45 - 239) * t);
            return (
              <span
                key={i}
                className="aspect-square rounded-[2px]"
                style={{ background: `rgb(${r}, ${g}, ${b})` }}
              />
            );
          })}
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
