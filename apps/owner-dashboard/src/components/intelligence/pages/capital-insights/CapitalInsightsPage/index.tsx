import { MetricCard } from '@/components/intelligence/cards/MetricCard';
import { BuyRentAnalysisSection } from '@/components/intelligence/pages/capital-insights/BuyRentAnalysisSection';
import { CapitalInsightsInfoBanner } from '@/components/intelligence/pages/capital-insights/CapitalInsightsInfoBanner';
import { EquipmentTracker } from '@/components/intelligence/pages/capital-insights/EquipmentTracker';
import { capitalInsightsMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const CapitalInsightsPage = () => (
  <div className="space-y-6">
    <MockDataBanner message="Equipment tracker + 24-month projections are live; the summary tiles below show sample data." />
    <CapitalInsightsInfoBanner />

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {capitalInsightsMetrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>

    <EquipmentTracker />

    <BuyRentAnalysisSection />
  </div>
);
