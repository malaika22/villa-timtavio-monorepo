import type { AnalyticsOverview, UpcomingStay } from '@repo/api-types';

import { API, api } from '@/lib/api';

export const analyticsApi = {
  overview: (period?: string) =>
    api.get<AnalyticsOverview>(API.analytics.overview(period)),
  upcomingStays: () => api.get<UpcomingStay[]>(API.analytics.upcomingStays),

  // String[] of narrative insights (see backend getIntelligenceAlerts).
  intelligenceAlerts: () =>
    api.get<string[]>(API.analytics.intelligenceAlerts),

  revenueTrend: (year: number, compare?: number) =>
    api.get<{ year: number; data: { month: number; revenue: number }[] }>(
      API.analytics.revenueTrend(year, compare),
    ),
  occupancy: (period?: string) =>
    api.get<{ occupancyRate: number; bookedNights: number; totalDays: number }>(
      API.analytics.occupancy(period),
    ),
  heatMap: (date?: string, range?: string, category?: string) =>
    api.get<unknown>(API.analytics.heatMap(date, range, category)),
  peakHours: (date?: string) => api.get<unknown>(API.analytics.peakHours(date)),
  experiences: (period?: string) =>
    api.get<unknown>(API.analytics.experiences(period)),
};
