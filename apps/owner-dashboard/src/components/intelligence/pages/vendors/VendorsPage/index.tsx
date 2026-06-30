import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { StrategicRecommendationsPanel } from '@/components/intelligence/pages/vendors/StrategicRecommendationsPanel';
import { VendorBookingsRatingScatter } from '@/components/intelligence/pages/vendors/VendorBookingsRatingScatter';
import { VendorDemandForecast } from '@/components/intelligence/pages/vendors/VendorDemandForecast';
import { VendorRoiAnalysisTable } from '@/components/intelligence/pages/vendors/VendorRoiAnalysisTable';
import { vendorIntelligenceMetrics } from '@/lib/mock-data';

export const VendorsPage = () => (
  <div className="space-y-6">
    <MetricCardGrid metrics={vendorIntelligenceMetrics} />

    <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
      <VendorBookingsRatingScatter />
      <VendorDemandForecast />
    </div>

    <VendorRoiAnalysisTable />

    <StrategicRecommendationsPanel />
  </div>
);
