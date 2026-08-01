'use client';

import { MetricCardGrid, DashboardCard } from '@repo/dashboard-ui';
import { Sparkles, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import {
  useAnalyticsOverview,
  useRevenueTrend,
  useUpcomingStays,
  useIntelligenceAlerts,
} from '@/hooks/useAnalytics';
import { formatRevenueCompact } from '@/lib/mappers/dashboard';

const MONTH_LABELS = [
  'J',
  'F',
  'M',
  'A',
  'M',
  'J',
  'J',
  'A',
  'S',
  'O',
  'N',
  'D',
];

export const OverviewPage = () => {
  const year = new Date().getFullYear();
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: revenue } = useRevenueTrend(year);
  const { data: upcoming } = useUpcomingStays();
  const { data: alerts } = useIntelligenceAlerts();

  const metrics = overview
    ? [
        {
          id: 'ytd-revenue',
          label: 'YTD REVENUE',
          value: formatRevenueCompact(overview.ytdRevenue),
          subtext: `${year} to date`,
        },
        {
          id: 'occupancy',
          label: 'OCCUPANCY',
          value: `${overview.occupancyRate}%`,
          subtext: 'Year to date',
        },
        {
          id: 'experiences',
          label: 'EXPERIENCES BOOKED',
          value: String(overview.experiencesBooked),
          subtext: 'Completed this year',
        },
        {
          id: 'satisfaction',
          label: 'AVG SATISFACTION',
          value: overview.avgSatisfaction.toFixed(2),
          subtext: 'Across all stays',
        },
      ]
    : [];

  const maxRevenue = Math.max(
    1,
    ...(revenue?.data.map((d) => d.revenue) ?? [0]),
  );

  return (
    <div className="space-y-5 font-inter">
      {/* Intelligence alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl border border-[#e8d4b8] bg-[#fff8f0] px-4 py-3"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[#b45309]" />
              <p className="text-sm text-[#8b6914]">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      {overviewLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-manager-border"
            />
          ))}
        </div>
      ) : (
        <MetricCardGrid metrics={metrics} variant="manager" columns={4} />
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        {/* Revenue trend */}
        <DashboardCard variant="manager" className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-manager-text">
              Revenue — {year}
            </h3>
            <TrendingUp className="size-4 text-manager-text-muted" />
          </div>
          {revenue && revenue.data.some((d) => d.revenue > 0) ? (
            <div className="flex h-40 items-end gap-1.5">
              {revenue.data.map((d) => (
                <div
                  key={d.month}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-[#4a7c59] transition-all"
                      style={{
                        height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%`,
                      }}
                      title={formatRevenueCompact(d.revenue)}
                    />
                  </div>
                  <span className="text-[9px] text-manager-text-muted">
                    {MONTH_LABELS[d.month - 1]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-manager-text-muted">
              No revenue recorded yet this year.
            </p>
          )}
        </DashboardCard>

        {/* Upcoming stays */}
        <DashboardCard
          variant="manager"
          padding={false}
          className="overflow-hidden"
        >
          <div className="border-b border-[#ebe6df] px-5 py-3.5">
            <h3 className="text-sm font-semibold text-manager-text">
              Upcoming Stays
            </h3>
          </div>
          {upcoming && upcoming.length > 0 ? (
            <ul className="divide-y divide-[#ebe6df]">
              {upcoming.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-manager-text">
                      {s.guestName}
                    </p>
                    <p className="text-xs text-manager-text-muted">
                      {format(new Date(s.checkIn), 'MMM d')} –{' '}
                      {format(new Date(s.checkOut), 'MMM d')} · {s.totalGuests}{' '}
                      guests
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[#4a7c59]">
                    {formatRevenueCompact(s.estimatedRevenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-manager-text-muted">
              No upcoming stays scheduled.
            </p>
          )}
        </DashboardCard>
      </section>
    </div>
  );
};
