'use client';

import { MetricCardGrid, DashboardCard } from '@repo/dashboard-ui';
import { Star } from 'lucide-react';
import {
  useAnalyticsOverview,
  useRevenueTrend,
  useOccupancy,
  useExperiencePerformance,
} from '@/hooks/useAnalytics';
import { formatRevenueCompact } from '@/lib/mappers/dashboard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const ReportsPage = () => {
  const year = new Date().getFullYear();
  const { data: overview, isLoading } = useAnalyticsOverview();
  const { data: revenue } = useRevenueTrend(year);
  const { data: occupancy } = useOccupancy();
  const { data: experiences } = useExperiencePerformance();

  const metrics = overview
    ? [
        { id: 'rev', label: 'YTD REVENUE', value: formatRevenueCompact(overview.ytdRevenue), subtext: `${year} to date` },
        { id: 'occ', label: 'OCCUPANCY', value: `${overview.occupancyRate}%`, subtext: 'Year to date' },
        { id: 'exp', label: 'EXPERIENCES BOOKED', value: String(overview.experiencesBooked), subtext: 'Completed' },
        { id: 'sat', label: 'AVG SATISFACTION', value: overview.avgSatisfaction.toFixed(2), subtext: 'All stays' },
      ]
    : [];

  const maxRevenue = Math.max(1, ...(revenue?.data.map((d) => d.revenue) ?? [0]));
  const topExperiences = (experiences ?? []).slice(0, 5);
  const maxBooked = Math.max(1, ...topExperiences.map((e) => e._count.experienceRequests));

  // Top vendors derived from experience performance
  const vendorMap = new Map<string, { name: string; booked: number; rating?: number | null }>();
  for (const e of experiences ?? []) {
    if (!e.vendor) continue;
    const cur = vendorMap.get(e.vendor.name) ?? { name: e.vendor.name, booked: 0, rating: e.vendor.averageRating };
    cur.booked += e._count.experienceRequests;
    vendorMap.set(e.vendor.name, cur);
  }
  const topVendors = Array.from(vendorMap.values()).sort((a, b) => b.booked - a.booked).slice(0, 5);

  return (
    <div className="font-inter space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-manager-border" />
          ))}
        </div>
      ) : (
        <MetricCardGrid metrics={metrics} variant="manager" columns={4} />
      )}

      {/* Revenue */}
      <DashboardCard variant="manager" className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-manager-text">Revenue — {year}</h3>
        {revenue && revenue.data.some((d) => d.revenue > 0) ? (
          <div className="flex h-44 items-end gap-2">
            {revenue.data.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t bg-[#4a7c59]" style={{ height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%` }} title={formatRevenueCompact(d.revenue)} />
                </div>
                <span className="text-[9px] text-manager-text-muted">{MONTHS[d.month - 1]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-manager-text-muted">No revenue recorded yet this year.</p>
        )}
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Experience popularity */}
        <DashboardCard variant="manager" className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-manager-text">Experience Popularity</h3>
          {topExperiences.length > 0 ? (
            <ul className="space-y-3">
              {topExperiences.map((e) => (
                <li key={e.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-manager-text">{e.name}</span>
                    <span className="text-manager-text-muted">{e._count.experienceRequests}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#ebe6df]">
                    <div className="h-full rounded-full bg-[#c4a882]" style={{ width: `${(e._count.experienceRequests / maxBooked) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-manager-text-muted">No experience bookings yet.</p>
          )}
        </DashboardCard>

        {/* Occupancy */}
        <DashboardCard variant="manager" className="flex flex-col items-center justify-center p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-manager-text-muted">Villa Occupancy (this month)</p>
          <p className="mt-2 font-cormorant text-[56px] leading-none text-manager-text">
            {occupancy ? `${occupancy.occupancyRate}%` : '—'}
          </p>
          {occupancy && (
            <p className="mt-2 text-sm text-manager-text-muted">
              {occupancy.bookedNights} of {occupancy.totalDays} nights booked
            </p>
          )}
        </DashboardCard>
      </div>

      {/* Top vendors */}
      <DashboardCard variant="manager" padding={false} className="overflow-hidden">
        <div className="border-b border-[#ebe6df] px-5 py-3.5">
          <h3 className="text-sm font-semibold text-manager-text">Top Vendors</h3>
        </div>
        {topVendors.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ebe6df] bg-[#f7f5f2] text-left text-[10px] uppercase tracking-[0.12em] text-manager-text-muted">
                <th className="px-5 py-2.5">Vendor</th>
                <th className="px-5 py-2.5">Bookings</th>
                <th className="px-5 py-2.5">Rating</th>
              </tr>
            </thead>
            <tbody>
              {topVendors.map((v) => (
                <tr key={v.name} className="border-b border-[#ebe6df] last:border-0">
                  <td className="px-5 py-3 font-medium text-manager-text">{v.name}</td>
                  <td className="px-5 py-3 text-manager-text">{v.booked}</td>
                  <td className="px-5 py-3">
                    {v.rating != null ? (
                      <span className="inline-flex items-center gap-1 text-manager-text">
                        <Star className="size-3.5 fill-[#c4a882] text-[#c4a882]" />
                        {v.rating.toFixed(1)}
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
          <p className="px-5 py-10 text-center text-sm text-manager-text-muted">No vendor activity yet.</p>
        )}
      </DashboardCard>
    </div>
  );
};
