import type { AnalyticsOverview, UpcomingStay } from '@repo/api-types';

import { API, api } from '@/lib/api';

export const analyticsApi = {
  overview: (period?: string) =>
    api.get<AnalyticsOverview>(API.analytics.overview(period)),
  upcomingStays: () =>
    api.get<UpcomingStay[]>(API.analytics.upcomingStays),
};
