'use client';
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

export const OverviewPage = () => {
  const { data: upcomingData, isLoading } = useUpcomingStaysAbbrev();
  const { data: overview } = useAnalyticsOverview();
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
