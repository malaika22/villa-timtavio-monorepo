'use client';

import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { experienceIntelligenceMetrics } from '@/lib/mock-data';
import { useExperienceKpis } from '@/hooks/useAnalytics';

// Headline experience KPIs aggregated from live per-experience performance,
// with the sample tiles as a loading fallback.
export const LiveExperienceKpis = () => {
  const { data } = useExperienceKpis();
  const live = data && Number(data[0]?.value) > 0;
  return (
    <MetricCardGrid metrics={live ? data : experienceIntelligenceMetrics} />
  );
};
