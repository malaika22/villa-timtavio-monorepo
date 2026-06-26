import { api, API } from '@/lib/api';
import type {
  AnalyticsOverview,
  RevenueTrend,
  OccupancyStats,
  HeatMapCell,
  PeakHour,
  ExperiencePerformanceItem,
  UpcomingStay,
} from '@repo/api-types';

export const emAnalyticsApi = {
  overview: (period?: string) =>
    api.get<AnalyticsOverview>(API.analytics.overview(period)),
  revenueTrend: (year: number, compare?: number) =>
    api.get<RevenueTrend>(API.analytics.revenueTrend(year, compare)),
  occupancy: (period?: string) =>
    api.get<OccupancyStats>(API.analytics.occupancy(period)),
  heatMap: (date?: string, range?: string, category?: string) =>
    api.get<HeatMapCell[]>(API.analytics.heatMap(date, range, category)),
  peakHours: (date?: string) =>
    api.get<PeakHour[]>(API.analytics.peakHours(date)),
  experiences: (period?: string) =>
    api.get<ExperiencePerformanceItem[]>(API.analytics.experiences(period)),
  upcomingStays: () => api.get<UpcomingStay[]>(API.analytics.upcomingStays),
  intelligenceAlerts: () =>
    api.get<string[]>(API.analytics.intelligenceAlerts),
};
