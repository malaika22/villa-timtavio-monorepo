'use client';

import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { KpiSkeleton } from '@/components/intelligence/ui/Skeletons';
import { useRevenueSummary } from '@/hooks/useAnalytics';

// Revenue summary header — real MoM/YoY KPI tiles from /analytics/revenue.
export const LiveRevenueKpis = () => {
  const { data, isLoading } = useRevenueSummary();
  if (isLoading) return <KpiSkeleton count={4} />;
  return <MetricCardGrid metrics={data ?? []} />;
};
