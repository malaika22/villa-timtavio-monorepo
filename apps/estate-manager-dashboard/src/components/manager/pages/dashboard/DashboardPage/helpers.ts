import type { DashboardKpis } from '@repo/api-types';
import { formatRevenueCompact } from '@/lib/mappers/dashboard';
import { DashboardMetricCard } from '@repo/dashboard-ui';

export function buildMetrics(kpis?: DashboardKpis): DashboardMetricCard[] {
  if (!kpis) return [];

  const revenueTrend =
    kpis.revenueVsLastWeek === 0
      ? 'Same as last week'
      : `${kpis.revenueVsLastWeek > 0 ? '+' : ''}${kpis.revenueVsLastWeek}% vs last week`;

  return [
    {
      id: 'in-house',
      label: 'GUESTS IN-HOUSE',
      value: String(kpis.guestsInHouse),
      trend: kpis.guestsInHouse > 0 ? undefined : 'No guests in-house',
      trendDirection: 'neutral',
    },
    {
      id: 'arriving',
      label: 'ARRIVING TODAY',
      value: String(kpis.arrivingToday),
      subtext:
        kpis.arrivingToday > 0 ? 'Check-ins scheduled' : 'No arrivals today',
    },
    {
      id: 'experiences',
      label: 'ACTIVE EXPERIENCES',
      value: String(kpis.activeExperiences),
      subtext:
        kpis.activeExperiences > 0
          ? 'In progress or confirmed'
          : 'No active experiences',
    },
    {
      id: 'afternoon',
      label: 'SCHEDULED THIS AFTERNOON',
      value: String(kpis.afternoonExperiences),
      subtext:
        kpis.afternoonExperiences > 0
          ? 'PM experiences today'
          : 'Nothing this afternoon',
    },
    {
      id: 'approvals',
      label: 'PENDING APPROVALS',
      value: String(kpis.pendingApprovals),
      trend: kpis.pendingApprovals > 0 ? 'Requires attention' : 'All clear',
      trendDirection: kpis.pendingApprovals > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'revenue',
      label: 'REVENUE TODAY',
      value: formatRevenueCompact(kpis.revenueToday),
      trend: revenueTrend,
      trendDirection:
        kpis.revenueVsLastWeek > 0
          ? 'up'
          : kpis.revenueVsLastWeek < 0
            ? 'down'
            : 'neutral',
    },
  ];
}
