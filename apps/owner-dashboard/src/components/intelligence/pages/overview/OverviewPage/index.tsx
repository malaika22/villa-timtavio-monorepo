'use client';
import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { OccupancyCalendar } from '@/components/intelligence/pages/overview/OccupancyCalendar';
import { OverviewTeasers } from '@/components/intelligence/pages/overview/OverviewTeasers';
import { RevenueTrendChart } from '@/components/intelligence/charts/RevenueTrendChart';
import { IntelligenceAlerts } from '@/components/intelligence/alerts/IntelligenceAlerts';
import { UpcomingStaysTable } from '@/components/intelligence/tables/UpcomingStaysTable';
import { KpiSkeleton } from '@/components/intelligence/ui/Skeletons';
import {
  useAnalyticsOverview,
  overviewToMetrics,
  useIntelligenceAlerts,
  useRevenueTrend,
  useUpcomingStaysAbbrev,
} from '@/hooks/useAnalytics';
import { usePeriod, PERIOD_SHORT } from '@/providers/period-provider';

export const OverviewPage = () => {
  const { period } = usePeriod();
  const { data: upcomingData, isLoading } = useUpcomingStaysAbbrev();
  const { data: overview, isLoading: overviewLoading } =
    useAnalyticsOverview(period);
  const { data: liveAlerts } = useIntelligenceAlerts();
  const { data: liveTrend } = useRevenueTrend(2026, 2025);
  const staysToShow = upcomingData ?? [];
  const metrics = overview ? overviewToMetrics(overview) : [];
  const alerts = liveAlerts ?? [];
  const trend = liveTrend ?? [];

  return (
    <div className="space-y-6">
      <p className="text-sm text-intel-text-muted">
        Showing metrics for{' '}
        <span className="font-medium text-intel-text">
          {PERIOD_SHORT[period]}
        </span>{' '}
        · change the range from the selector above.
      </p>

      {overviewLoading ? <KpiSkeleton count={4} /> : <MetricCardGrid metrics={metrics} />}

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
