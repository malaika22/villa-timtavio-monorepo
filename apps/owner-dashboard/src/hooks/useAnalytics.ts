import { useQuery } from '@tanstack/react-query';
import type { AnalyticsOverview } from '@repo/api-types';

import { analyticsApi } from '@/lib/api/analytics';
import type { MetricCard } from '@/types';

// Owner dashboard refreshes every 10 minutes (no real-time).
const TEN_MINUTES = 10 * 60 * 1000;

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value.toLocaleString()}`;
}

export function overviewToMetrics(o: AnalyticsOverview): MetricCard[] {
  return [
    {
      id: 'ytd-revenue',
      label: 'YTD REVENUE',
      value: formatCompact(o.ytdRevenue),
    },
    {
      id: 'estate-occupancy',
      label: 'ESTATE OCCUPANCY',
      value: `${o.occupancyRate}%`,
    },
    {
      id: 'experiences',
      label: 'EXPERIENCES BOOKED',
      value: String(o.experiencesBooked),
    },
    {
      id: 'satisfaction',
      label: 'AVG GUEST SATISFACTION',
      value: o.avgSatisfaction ? o.avgSatisfaction.toFixed(2) : '—',
    },
  ];
}

export function useAnalyticsOverview(period?: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', period ?? 'ytd'],
    queryFn: () => analyticsApi.overview(period),
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}
