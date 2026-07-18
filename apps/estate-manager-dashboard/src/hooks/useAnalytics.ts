import { useQuery } from '@tanstack/react-query';
import { emAnalyticsApi } from '@/lib/api/analytics';

const STALE = 60_000;

export function useAnalyticsOverview(period?: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', period ?? 'ytd'],
    queryFn: () => emAnalyticsApi.overview(period),
    staleTime: STALE,
  });
}

export function useRevenueTrend(year: number, compare?: number) {
  return useQuery({
    queryKey: ['analytics', 'revenue-trend', year, compare ?? null],
    queryFn: () => emAnalyticsApi.revenueTrend(year, compare),
    staleTime: STALE,
  });
}

export function useOccupancy(period?: string) {
  return useQuery({
    queryKey: ['analytics', 'occupancy', period ?? 'month'],
    queryFn: () => emAnalyticsApi.occupancy(period),
    staleTime: STALE,
  });
}

export function useHeatMap(date?: string, range?: string, category?: string) {
  return useQuery({
    queryKey: [
      'analytics',
      'heat-map',
      date ?? null,
      range ?? null,
      category ?? null,
    ],
    queryFn: () => emAnalyticsApi.heatMap(date, range, category),
    staleTime: STALE,
  });
}

export function usePeakHours(date?: string) {
  return useQuery({
    queryKey: ['analytics', 'peak-hours', date ?? null],
    queryFn: () => emAnalyticsApi.peakHours(date),
    staleTime: STALE,
  });
}

export function useExperiencePerformance(period?: string) {
  return useQuery({
    queryKey: ['analytics', 'experiences', period ?? 'ytd'],
    queryFn: () => emAnalyticsApi.experiences(period),
    staleTime: STALE,
  });
}

export function useUpcomingStays() {
  return useQuery({
    queryKey: ['analytics', 'upcoming-stays'],
    queryFn: emAnalyticsApi.upcomingStays,
    staleTime: STALE,
  });
}

export function useIntelligenceAlerts() {
  return useQuery({
    queryKey: ['analytics', 'intelligence-alerts'],
    queryFn: emAnalyticsApi.intelligenceAlerts,
    staleTime: STALE,
  });
}
