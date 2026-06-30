import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { DemandInsightsPanel } from '@/components/intelligence/pages/experiences/DemandInsightsPanel';
import { ExperienceSeasonality } from '@/components/intelligence/pages/experiences/ExperienceSeasonality';
import { ExperiencePerformanceTable } from '@/components/intelligence/pages/experiences/ExperiencePerformanceTable';
import { experienceIntelligenceMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const ExperiencesPage = () => (
  <div className="space-y-6">
    <MockDataBanner message="Performance counts and the 52-week seasonality are live; revenue figures show sample data." />
    <MetricCardGrid metrics={experienceIntelligenceMetrics} />

    <ExperienceSeasonality />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-stretch">
      <ExperiencePerformanceTable />
      <DemandInsightsPanel />
    </div>
  </div>
);
