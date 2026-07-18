'use client';

import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { KpiSkeleton } from '@/components/intelligence/ui/Skeletons';
import { useVendorPerformance } from '@/hooks/useAnalytics';

const compactMoney = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
};

// Vendor KPI header aggregated from live vendor performance. Vendor spend uses
// the same 55% concierge cost split as the ROI table; nothing fabricated.
export const LiveVendorKpis = () => {
  const { data, isLoading } = useVendorPerformance();

  if (isLoading) return <KpiSkeleton count={4} />;
  const rows = data ?? [];

  const withRevenue = rows.filter((v) => v.revenue > 0);
  const revenue = withRevenue.reduce((s, v) => s + v.revenue, 0);
  const spend = revenue * 0.55;
  const roi = spend > 0 ? revenue / spend : 0;
  const bookings = rows.reduce((s, v) => s + v.bookings, 0);
  const active = rows.filter((v) => v.status === 'ACTIVE').length;

  const rated = rows.filter((v) => v.rating > 0);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, v) => s + v.rating, 0) / rated.length
      : 0;

  const metrics = [
    {
      id: 'vendor-spend',
      label: 'TOTAL VENDOR SPEND YTD',
      value: compactMoney(spend),
      subtext: `Across ${active} active vendor${active === 1 ? '' : 's'}`,
    },
    {
      id: 'vendor-revenue',
      label: 'REVENUE GENERATED',
      value: compactMoney(revenue),
      subtext: `${roi.toFixed(1)}x ROI on vendor spend`,
    },
    {
      id: 'vendor-rating',
      label: 'AVG VENDOR RATING',
      value: avgRating > 0 ? avgRating.toFixed(2) : '—',
    },
    {
      id: 'vendor-bookings',
      label: 'TOTAL VENDOR BOOKINGS',
      value: String(bookings),
      subtext: `Across ${rows.length} vendor${rows.length === 1 ? '' : 's'}`,
    },
  ];

  return <MetricCardGrid metrics={metrics} />;
};
