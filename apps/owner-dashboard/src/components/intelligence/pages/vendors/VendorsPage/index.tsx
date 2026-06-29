import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { RoiByVendorChart } from '@/components/intelligence/pages/vendors/RoiByVendorChart';
import { StrategicRecommendationsPanel } from '@/components/intelligence/pages/vendors/StrategicRecommendationsPanel';
import { VendorBookingsRatingScatter } from '@/components/intelligence/pages/vendors/VendorBookingsRatingScatter';
import { VendorRoiAnalysisTable } from '@/components/intelligence/pages/vendors/VendorRoiAnalysisTable';
import { vendorIntelligenceMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const VendorsPage = () => (
  <div className="space-y-6">
    <MockDataBanner message="ROI sample data shown where noted. Bookings, ratings and the scatter are live." />
    <MetricCardGrid metrics={vendorIntelligenceMetrics} />

    <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
      <VendorBookingsRatingScatter />
      <StrategicRecommendationsPanel />
    </div>

    <VendorRoiAnalysisTable />

    <RoiByVendorChart />
  </div>
);
