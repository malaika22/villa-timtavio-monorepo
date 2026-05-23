import { MetricCard } from '@/components/intelligence/cards/MetricCard';
import { BuyRentAnalysisSection } from '@/components/intelligence/pages/capital-insights/BuyRentAnalysisSection';
import { CapitalInsightsInfoBanner } from '@/components/intelligence/pages/capital-insights/CapitalInsightsInfoBanner';
import { capitalInsightsMetrics } from '@/lib/mock-data';

export const CapitalInsightsPage = () => (
  <div className="space-y-6">
    <CapitalInsightsInfoBanner />

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {capitalInsightsMetrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>

    <BuyRentAnalysisSection />
  </div>
);
