'use client';
import { useState } from 'react';
import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { OccupancyCalendar } from '@/components/intelligence/pages/overview/OccupancyCalendar';
import { OverviewTeasers } from '@/components/intelligence/pages/overview/OverviewTeasers';
import { RevenueTrendChart } from '@/components/intelligence/charts/RevenueTrendChart';
import { IntelligenceAlerts } from '@/components/intelligence/alerts/IntelligenceAlerts';
import { UpcomingStaysTable } from '@/components/intelligence/tables/UpcomingStaysTable';
import {
  intelligenceAlerts,
  overviewMetrics,
  revenueTrendData,
  upcomingStays,
} from '@/lib/mock-data';
import {
  useAnalyticsOverview,
  overviewToMetrics,
  useIntelligenceAlerts,
  useRevenueTrend,
  useUpcomingStaysAbbrev,
} from '@/hooks/useAnalytics';

const PERIODS: { value: string; label: string }[] = [
  { value: 'mtd', label: 'MTD' },
  { value: 'qtd', label: 'QTD' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'YTD' },
];

export const OverviewPage = () => {
  const [period, setPeriod] = useState('ytd');
  const { data: upcomingData, isLoading } = useUpcomingStaysAbbrev();
  const { data: overview } = useAnalyticsOverview(period);
  const { data: liveAlerts } = useIntelligenceAlerts();
  const { data: liveTrend } = useRevenueTrend(2026, 2025);
  const staysToShow = upcomingData ?? upcomingStays;
  const metrics = overview ? overviewToMetrics(overview) : overviewMetrics;
  const alerts =
    liveAlerts && liveAlerts.length > 0 ? liveAlerts : intelligenceAlerts;
  const trend =
    liveTrend && liveTrend.some((m) => m.y2026 || m.y2025)
      ? liveTrend
      : revenueTrendData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-intel-text-muted">Showing metrics for</p>
        <div className="inline-flex rounded-md border border-intel-border bg-intel-card p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={
                period === p.value
                  ? 'rounded px-2.5 py-1 text-xs bg-intel-maroon text-white'
                  : 'rounded px-2.5 py-1 text-xs text-intel-text-muted hover:text-intel-text'
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <MetricCardGrid metrics={metrics} />

      <OverviewTeasers />

      <OccupancyCalendar />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <RevenueTrendChart data={trend} />
        <IntelligenceAlerts alerts={alerts} />
      </section>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-[#f0ede8]" />
      ) : (
        <UpcomingStaysTable stays={staysToShow} />
      )}
    </div>
  );
};
