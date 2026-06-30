import { BuyRentAnalysisSection } from '@/components/intelligence/pages/capital-insights/BuyRentAnalysisSection';
import { CapitalInsightsInfoBanner } from '@/components/intelligence/pages/capital-insights/CapitalInsightsInfoBanner';
import { CapitalSummaryTiles } from '@/components/intelligence/pages/capital-insights/CapitalSummaryTiles';
import { EquipmentTracker } from '@/components/intelligence/pages/capital-insights/EquipmentTracker';

export const CapitalInsightsPage = () => (
  <div className="space-y-6">
    <CapitalInsightsInfoBanner />

    <CapitalSummaryTiles />

    <EquipmentTracker />

    <BuyRentAnalysisSection />
  </div>
);
