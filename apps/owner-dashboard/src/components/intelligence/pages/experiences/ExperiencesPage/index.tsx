import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { DemandInsightsPanel } from '@/components/intelligence/pages/experiences/DemandInsightsPanel';
import { ExperienceDemandTrendChart } from '@/components/intelligence/pages/experiences/ExperienceDemandTrendChart';
import { ExperiencePerformanceTable } from '@/components/intelligence/pages/experiences/ExperiencePerformanceTable';
import { experienceIntelligenceMetrics } from '@/lib/mock-data';

/** Owner Screen 4 — Experience Intelligence (Figma node 268:1747) */
export const ExperiencesPage = () => (
  <div className="space-y-6">
    <MetricCardGrid metrics={experienceIntelligenceMetrics} />

    <ExperienceDemandTrendChart />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-stretch">
      <ExperiencePerformanceTable />
      <DemandInsightsPanel />
    </div>
  </div>
);
