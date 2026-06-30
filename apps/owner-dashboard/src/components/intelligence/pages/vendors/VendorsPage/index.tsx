import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { RoiByVendorChart } from '@/components/intelligence/pages/vendors/RoiByVendorChart';
import { StrategicRecommendationsPanel } from '@/components/intelligence/pages/vendors/StrategicRecommendationsPanel';
import { VendorBookingsRatingScatter } from '@/components/intelligence/pages/vendors/VendorBookingsRatingScatter';
import { VendorDemandForecast } from '@/components/intelligence/pages/vendors/VendorDemandForecast';
import { VendorRoiAnalysisTable } from '@/components/intelligence/pages/vendors/VendorRoiAnalysisTable';
import { vendorIntelligenceMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const VendorsPage = () => (
  <div className="space-y-6">
    <MockDataBanner message="Bookings, ratings, ROI, the scatter and the demand forecast are live; strategic recommendations show sample data." />
    <MetricCardGrid metrics={vendorIntelligenceMetrics} />

    <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
      <VendorBookingsRatingScatter />
      <VendorDemandForecast />
    </div>

    <VendorRoiAnalysisTable />

    <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
      <RoiByVendorChart />
      <StrategicRecommendationsPanel />
    </div>
  </div>
);
