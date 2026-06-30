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

const VARIANTS = ['success', 'warning', 'info', 'peach'] as const;

export function useIntelligenceAlerts() {
  return useQuery({
    queryKey: ['analytics', 'intelligence-alerts'],
    queryFn: analyticsApi.intelligenceAlerts,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
    // Map the backend's string[] into the UI alert shape.
    select: (messages) =>
      messages.map((message, i) => ({
        id: `alert-${i}`,
        variant: VARIANTS[i % VARIANTS.length],
        message,
      })),
  });
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function useRevenueTrend(year: number, compare?: number) {
  return useQuery({
    queryKey: ['analytics', 'revenue-trend', year, compare ?? null],
    queryFn: () => analyticsApi.revenueTrend(year, compare),
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
    // Map to the chart's RevenueMonth[] shape (values in $thousands).
    select: (res) =>
      res.data.map((d) => ({
        month: MONTHS[d.month - 1],
        y2026: Math.round(d.revenue / 1000),
        y2025: Math.round(d.compareRevenue / 1000),
      })),
  });
}

export function useExperiencePerformance(period?: string) {
  return useQuery({
    queryKey: ['analytics', 'experiences', period ?? 'ytd'],
    queryFn: () => analyticsApi.experiences(period),
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useSatisfaction() {
  return useQuery({
    queryKey: ['analytics', 'satisfaction'],
    queryFn: analyticsApi.satisfaction,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useHeatMap(category?: string) {
  return useQuery({
    queryKey: ['analytics', 'heat-map', category ?? 'all'],
    queryFn: () => analyticsApi.heatMap(undefined, undefined, category),
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useOccupancyCalendar() {
  return useQuery({
    queryKey: ['analytics', 'occupancy-calendar'],
    queryFn: analyticsApi.occupancyCalendar,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useExperienceSeasonality() {
  return useQuery({
    queryKey: ['analytics', 'experience-seasonality'],
    queryFn: analyticsApi.experienceSeasonality,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useHeatMapCell(
  cell: { space: string; timeBlock: string } | null,
) {
  return useQuery({
    queryKey: ['analytics', 'heat-map-cell', cell?.space, cell?.timeBlock],
    queryFn: () => analyticsApi.heatMapCell(cell!.space, cell!.timeBlock),
    enabled: !!cell,
    staleTime: TEN_MINUTES,
  });
}

export function useVendorPerformance() {
  return useQuery({
    queryKey: ['analytics', 'vendors'],
    queryFn: analyticsApi.vendors,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useRevenueMix() {
  return useQuery({
    queryKey: ['analytics', 'revenue-mix'],
    queryFn: analyticsApi.revenueMix,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}
