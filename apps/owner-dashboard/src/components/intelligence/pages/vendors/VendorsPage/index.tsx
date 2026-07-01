import { LiveVendorKpis } from '@/components/intelligence/pages/vendors/LiveVendorKpis';
import { StrategicRecommendationsPanel } from '@/components/intelligence/pages/vendors/StrategicRecommendationsPanel';
import { VendorBookingsRatingScatter } from '@/components/intelligence/pages/vendors/VendorBookingsRatingScatter';
import { VendorDemandForecast } from '@/components/intelligence/pages/vendors/VendorDemandForecast';
import { VendorRoiAnalysisTable } from '@/components/intelligence/pages/vendors/VendorRoiAnalysisTable';

export const VendorsPage = () => (
  <div className="space-y-6">
    <LiveVendorKpis />

    <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
      <VendorBookingsRatingScatter />
      <VendorDemandForecast />
    </div>

    <VendorRoiAnalysisTable />

    <StrategicRecommendationsPanel />
  </div>
);
