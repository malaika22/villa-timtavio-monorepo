'use client';

import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { KpiSkeleton } from '@/components/intelligence/ui/Skeletons';
import { useExperienceKpis } from '@/hooks/useAnalytics';
import { usePeriod } from '@/providers/period-provider';

// Headline experience KPIs aggregated from live per-experience performance.
export const LiveExperienceKpis = () => {
  const { period } = usePeriod();
  const { data, isLoading } = useExperienceKpis(period);
  if (isLoading) return <KpiSkeleton count={4} />;
  return <MetricCardGrid metrics={data ?? []} />;
};
