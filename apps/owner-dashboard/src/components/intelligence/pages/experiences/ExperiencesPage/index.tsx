import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { DemandInsightsPanel } from '@/components/intelligence/pages/experiences/DemandInsightsPanel';
import { ExperienceDemandTrendChart } from '@/components/intelligence/pages/experiences/ExperienceDemandTrendChart';
import { ExperiencePerformanceTable } from '@/components/intelligence/pages/experiences/ExperiencePerformanceTable';
import { experienceIntelligenceMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const ExperiencesPage = () => (
  <div className="space-y-6">
    <MockDataBanner message="Revenue and trend data requires analytics API — showing sample data. Booking counts are live." />
    <MetricCardGrid metrics={experienceIntelligenceMetrics} />

    <ExperienceDemandTrendChart />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-stretch">
      <ExperiencePerformanceTable />
      <DemandInsightsPanel />
    </div>
  </div>
);
