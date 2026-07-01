import { DemandInsightsPanel } from '@/components/intelligence/pages/experiences/DemandInsightsPanel';
import { ExperienceSeasonality } from '@/components/intelligence/pages/experiences/ExperienceSeasonality';
import { ExperiencePerformanceTable } from '@/components/intelligence/pages/experiences/ExperiencePerformanceTable';
import { LiveExperienceKpis } from '@/components/intelligence/pages/experiences/LiveExperienceKpis';

export const ExperiencesPage = () => (
  <div className="space-y-6">
    <LiveExperienceKpis />

    <ExperienceSeasonality />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-stretch">
      <ExperiencePerformanceTable />
      <DemandInsightsPanel />
    </div>
  </div>
);
