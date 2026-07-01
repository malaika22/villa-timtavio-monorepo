'use client';

import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { analyticsMetrics } from '@/lib/mock-data';
import { useRevenueSummary } from '@/hooks/useAnalytics';

// Revenue summary header — real MoM/YoY KPI tiles from /analytics/revenue,
// with the sample tiles as a loading fallback.
export const LiveRevenueKpis = () => {
  const { data } = useRevenueSummary();
  return <MetricCardGrid metrics={data ?? analyticsMetrics} />;
};
