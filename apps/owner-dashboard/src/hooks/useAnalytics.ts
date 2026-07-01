import { useQuery } from '@tanstack/react-query';
import type { AnalyticsOverview } from '@repo/api-types';

import { analyticsApi } from '@/lib/api/analytics';
import type { ExperiencePerformanceRow, MetricCard } from '@/types';

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

const moneyFull = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function useExperiencePerformance(period?: string) {
  return useQuery({
    queryKey: ['analytics', 'experiences', period ?? 'ytd'],
    queryFn: () => analyticsApi.experiences(period),
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
    // Map API rows into the table's ExperiencePerformanceRow shape.
    select: (rows): ExperiencePerformanceRow[] =>
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        bookings: r.bookings,
        revenue: r.revenue > 0 ? moneyFull(r.revenue) : '—',
        rating: r.rating,
        declined: r.declined,
        declinedPercent: r.declinedPercent,
        trend:
          r.trendPercent === null
            ? '—'
            : `${r.trendPercent >= 0 ? '↑' : '↓'} ${Math.abs(r.trendPercent)}%`,
        trendDirection:
          r.trendPercent === null
            ? 'neutral'
            : r.trendPercent >= 0
              ? 'up'
              : 'down',
      })),
  });
}

export function useExperienceKpis() {
  return useQuery({
    queryKey: ['analytics', 'experiences', 'ytd'],
    queryFn: () => analyticsApi.experiences(),
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
    // Aggregate the raw rows into the four headline experience tiles.
    select: (rows): MetricCard[] => {
      const booked = rows.reduce((s, r) => s + r.bookings, 0);
      const revenue = rows.reduce((s, r) => s + r.revenue, 0);
      const declined = rows.reduce((s, r) => s + r.declined, 0);
      const avgPer = booked > 0 ? Math.round(revenue / booked) : 0;
      const declineBase = booked + declined;
      const declineRate =
        declineBase > 0
          ? Math.round((declined / declineBase) * 1000) / 10
          : 0;
      return [
        { id: 'exp-booked', label: 'TOTAL BOOKED YTD', value: String(booked) },
        {
          id: 'exp-revenue',
          label: 'REVENUE FROM EXPERIENCES',
          value: formatCompact(revenue),
        },
        {
          id: 'exp-avg',
          label: 'AVG PER EXPERIENCE',
          value: avgPer > 0 ? moneyFull(avgPer) : '—',
        },
        {
          id: 'exp-decline',
          label: 'DECLINE / CONFLICT RATE',
          value: `${declineRate}%`,
          trendDirection: declineRate > 10 ? 'warning' : 'neutral',
        },
      ];
    },
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

function trend(percent: number | null, suffix: string): Partial<MetricCard> {
  if (percent === null) return {};
  const up = percent >= 0;
  return {
    trend: `${up ? '↑' : '↓'} ${Math.abs(percent)}% ${suffix}`,
    trendDirection: up ? 'up' : 'down',
  };
}

export function useRevenueSummary() {
  return useQuery({
    queryKey: ['analytics', 'revenue-summary'],
    queryFn: analyticsApi.revenueSummary,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
    // Map the summary into the 4 headline KPI tiles.
    select: (s): MetricCard[] => {
      const prevYear = s.year - 1;
      const stayPts = Math.round((s.avgStayNights - s.priorAvgStayNights) * 10) / 10;
      const repeatPts = s.repeatRatePercent - s.priorRepeatRatePercent;
      return [
        {
          id: 'ytd-revenue',
          label: `REVENUE — YTD ${s.year}`,
          value: formatCompact(s.revenue),
          ...trend(s.revenueYoyPercent, `vs ${prevYear}`),
        },
        {
          id: 'revpav',
          label: 'REVPAV (PER AVAILABLE VILLA-NIGHT)',
          value: formatCompact(s.revPav),
          ...trend(s.revPavYoyPercent, `vs ${prevYear}`),
        },
        {
          id: 'stay-duration',
          label: 'AVG STAY DURATION',
          value: `${s.avgStayNights} nights`,
          ...(s.priorAvgStayNights > 0
            ? {
                trend: `${stayPts >= 0 ? '↑' : '↓'} ${Math.abs(stayPts)} vs ${s.priorAvgStayNights} in ${prevYear}`,
                trendDirection: stayPts >= 0 ? ('up' as const) : ('down' as const),
              }
            : {}),
        },
        {
          id: 'repeat-rate',
          label: 'REPEAT GUEST RATE',
          value: `${s.repeatRatePercent}%`,
          ...(s.priorRepeatRatePercent > 0
            ? {
                trend: `${repeatPts >= 0 ? '↑' : '↓'} ${Math.abs(repeatPts)} pts vs ${prevYear}`,
                trendDirection: repeatPts >= 0 ? ('up' as const) : ('down' as const),
              }
            : {}),
        },
      ];
    },
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

export function usePeakHours(date?: string) {
  return useQuery({
    queryKey: ['analytics', 'peak-hours', date ?? 'today'],
    queryFn: () => analyticsApi.peakHours(date),
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useEquipmentAnalysis() {
  return useQuery({
    queryKey: ['analytics', 'equipment'],
    queryFn: analyticsApi.equipment,
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

const STAY_MONTHS = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// Privacy-safe upcoming stays for the owner (abbreviated names from analytics).
export function useUpcomingStaysAbbrev() {
  return useQuery({
    queryKey: ['analytics', 'upcoming-stays'],
    queryFn: analyticsApi.upcomingStays,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
    select: (rows) =>
      rows.map((s) => {
        const today = new Date().toISOString().slice(0, 10);
        const arrivingToday = s.checkIn.slice(0, 10) === today;
        return {
          id: s.id,
          guestName: s.guestAbbreviated,
          guestInitials: s.guestInitials,
          guestMeta: `${s.nights} night${s.nights === 1 ? '' : 's'}`,
          villas: 'Villa TimTavio',
          arrival: STAY_MONTHS(s.checkIn),
          departure: STAY_MONTHS(s.checkOut),
          nights: s.nights,
          party: s.totalGuests,
          source: 'Direct',
          estRevenue: `$${Math.round(s.estimatedRevenue).toLocaleString()}`,
          status: (arrivingToday ? 'arriving-today' : 'confirmed') as
            | 'arriving-today'
            | 'confirmed'
            | 'pending-review',
        };
      }),
  });
}

export function useHeatMapInsights() {
  return useQuery({
    queryKey: ['analytics', 'heat-map-insights'],
    queryFn: analyticsApi.heatMapInsights,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useExperienceInsights() {
  return useQuery({
    queryKey: ['analytics', 'experience-insights'],
    queryFn: analyticsApi.experienceInsights,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useVendorForecast() {
  return useQuery({
    queryKey: ['analytics', 'vendor-forecast'],
    queryFn: analyticsApi.vendorForecast,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useUnmetDemand() {
  return useQuery({
    queryKey: ['analytics', 'unmet-demand'],
    queryFn: analyticsApi.unmetDemand,
    refetchInterval: TEN_MINUTES,
    staleTime: TEN_MINUTES,
  });
}

export function useOccupancyMonthly() {
  return useQuery({
    queryKey: ['analytics', 'occupancy-monthly'],
    queryFn: analyticsApi.occupancyMonthly,
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
