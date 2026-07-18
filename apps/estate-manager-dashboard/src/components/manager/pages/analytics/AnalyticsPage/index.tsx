'use client';

import { DashboardCard } from '@repo/dashboard-ui';
import { Star } from 'lucide-react';
import {
  useRevenueTrend,
  useOccupancy,
  useExperiencePerformance,
} from '@/hooks/useAnalytics';
import { formatRevenueCompact } from '@/lib/mappers/dashboard';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const AnalyticsPage = () => {
  const year = new Date().getFullYear();
  const { data: revenue, isLoading: revLoading } = useRevenueTrend(year);
  const { data: occupancy } = useOccupancy();
  const { data: experiences } = useExperiencePerformance();

  const maxRevenue = Math.max(
    1,
    ...(revenue?.data.map((d) => d.revenue) ?? [0]),
  );
  const totalRevenue = (revenue?.data ?? []).reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-5 font-inter">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <DashboardCard variant="manager" className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-manager-text-muted">
            {year} Revenue
          </p>
          <p className="mt-1 font-cormorant text-[32px] leading-none text-manager-text">
            {formatRevenueCompact(totalRevenue)}
          </p>
        </DashboardCard>
        <DashboardCard variant="manager" className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-manager-text-muted">
            Occupancy (mo.)
          </p>
          <p className="mt-1 font-cormorant text-[32px] leading-none text-manager-text">
            {occupancy ? `${occupancy.occupancyRate}%` : '—'}
          </p>
          {occupancy && (
            <p className="mt-1 text-xs text-manager-text-muted">
              {occupancy.bookedNights}/{occupancy.totalDays} nights
            </p>
          )}
        </DashboardCard>
        <DashboardCard variant="manager" className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-manager-text-muted">
            Active Experiences
          </p>
          <p className="mt-1 font-cormorant text-[32px] leading-none text-manager-text">
            {experiences?.length ?? '—'}
          </p>
        </DashboardCard>
      </div>

      {/* Revenue trend */}
      <DashboardCard variant="manager" className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-manager-text">
          Monthly Revenue — {year}
        </h3>
        {revLoading ? (
          <div className="h-44 animate-pulse rounded-lg bg-manager-border" />
        ) : revenue && revenue.data.some((d) => d.revenue > 0) ? (
          <div className="flex h-44 items-end gap-2">
            {revenue.data.map((d) => (
              <div
                key={d.month}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-[#4a7c59]"
                    style={{
                      height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%`,
                    }}
                    title={formatRevenueCompact(d.revenue)}
                  />
                </div>
                <span className="text-[9px] text-manager-text-muted">
                  {MONTHS[d.month - 1]}
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

      {/* Experience performance */}
      <DashboardCard
        variant="manager"
        padding={false}
        className="overflow-hidden"
      >
        <div className="border-b border-[#ebe6df] px-5 py-3.5">
          <h3 className="text-sm font-semibold text-manager-text">
            Experience Performance
          </h3>
        </div>
        {experiences && experiences.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ebe6df] bg-[#f7f5f2] text-left text-[10px] uppercase tracking-[0.12em] text-manager-text-muted">
                <th className="px-5 py-2.5">Experience</th>
                <th className="px-5 py-2.5">Provider</th>
                <th className="px-5 py-2.5">Booked</th>
                <th className="px-5 py-2.5">Rating</th>
              </tr>
            </thead>
            <tbody>
              {experiences.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[#ebe6df] last:border-0"
                >
                  <td className="px-5 py-3 font-medium text-manager-text">
                    {e.name}
                  </td>
                  <td className="px-5 py-3 text-manager-text-muted">
                    {e.vendor?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-manager-text">
                    {e._count.experienceRequests}
                  </td>
                  <td className="px-5 py-3">
                    {e.vendor?.averageRating != null ? (
                      <span className="inline-flex items-center gap-1 text-manager-text">
                        <Star className="size-3.5 fill-[#c4a882] text-[#c4a882]" />
                        {e.vendor.averageRating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-manager-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-manager-text-muted">
            No experience data yet.
          </p>
        )}
      </DashboardCard>
    </div>
  );
};
