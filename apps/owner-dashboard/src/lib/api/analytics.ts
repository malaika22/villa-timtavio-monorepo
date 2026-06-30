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
  occupancyCalendar: () =>
    api.get<OccupancyDay[]>(API.analytics.occupancyCalendar),
  occupancyMonthly: () =>
    api.get<{ month: string; y2026: number; y2025: number }[]>(
      API.analytics.occupancyMonthly,
    ),
  experienceSeasonality: () =>
    api.get<SeasonalityWeek[]>(API.analytics.experienceSeasonality),
  equipment: () => api.get<EquipmentAnalysis>(API.analytics.equipment),
  unmetDemand: () => api.get<UnmetDemandResponse>(API.analytics.unmetDemand),
  heatMapInsights: () =>
    api.get<{ insights: string[] }>(API.analytics.heatMapInsights),
  experienceInsights: () =>
    api.get<{ insights: string[] }>(API.analytics.experienceInsights),
  vendorForecast: () => api.get<VendorForecastRow[]>(API.analytics.vendorForecast),
};

export interface VendorForecastRow {
  id: string;
  name: string;
  last90: number;
  monthlyRate: number;
  projectedNextQuarter: number;
  recommendation: string;
}

export interface UnmetDemandResponse {
  count: number;
  estimatedLostRevenue: number;
  items: {
    id: string;
    from: string;
    to: string;
    nights: number;
    guestCount: number | null;
    estimatedRevenue: number;
  }[];
}

export interface EquipmentRow {
  id: string;
  name: string;
  category: string;
  rentalCostPerUse: number;
  purchasePrice: number;
  usesPerYear: number;
  annualRental: number;
  breakEvenUses: number | null;
  twoYearSavings: number;
  recommendation: 'BUY' | 'MONITOR' | 'RENT';
  seasonalNotes: string | null;
  annualMaintenance: number;
  projection: { month: number; rent: number; own: number }[];
}

export interface EquipmentAnalysis {
  totalProjectedSavings: number;
  items: EquipmentRow[];
}

export interface OccupancyDay {
  date: string;
  bookings: number;
  guests: number;
  occupied: boolean;
}

export interface SeasonalityWeek {
  week: number;
  total: number;
  byCategory: Record<string, number>;
}

export interface VendorPerfRow {
  id: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  bookings: number;
  revenue: number;
  rating: number;
}

export interface RevenueMixResponse {
  total: number;
  slices: { key: string; label: string; value: number }[];
  topItems: { description: string; total: number; count: number }[];
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
