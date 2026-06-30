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
    api.get<{
      year: number;
      compareYear: number;
      data: { month: number; revenue: number; compareRevenue: number }[];
    }>(API.analytics.revenueTrend(year, compare)),
  occupancy: (period?: string) =>
    api.get<{ occupancyRate: number; bookedNights: number; totalDays: number }>(
      API.analytics.occupancy(period),
    ),
  heatMap: (date?: string, range?: string, category?: string) =>
    api.get<{ space: string; timeBlock: string; activityScore: number }[]>(
      API.analytics.heatMap(date, range, category),
    ),
  peakHours: (date?: string) => api.get<unknown>(API.analytics.peakHours(date)),
  heatMapCell: (space: string, timeBlock: string) =>
    api.get<HeatMapCellResponse>(API.analytics.heatMapCell(space, timeBlock)),
  experiences: (period?: string) =>
    api.get<unknown>(API.analytics.experiences(period)),
  satisfaction: () => api.get<SatisfactionResponse>(API.analytics.satisfaction),
  vendors: () => api.get<VendorPerfRow[]>(API.analytics.vendors),
  revenueMix: () => api.get<RevenueMixResponse>(API.analytics.revenueMix),
};

export interface VendorPerfRow {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  rating: number;
}

export interface RevenueMixResponse {
  total: number;
  slices: { key: string; label: string; value: number }[];
}

export interface HeatMapCellResponse {
  space: string;
  timeBlock: string;
  total: number;
  withCost: number;
  withoutCost: number;
  byType: { type: string; count: number }[];
  timeline: { time: string; serviceType: string; hasCost: boolean }[];
}

export interface SatisfactionResponse {
  overall: number;
  reviewCount: number;
  categories: { key: string; label: string; score: number }[];
  trend: { month: string; score: number }[];
  themes: { praise: string[]; improvement: string[] };
  scatter: { name: string; satisfaction: number; revenue: number }[];
}
