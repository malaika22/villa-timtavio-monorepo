import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { RoiByVendorChart } from '@/components/intelligence/pages/vendors/RoiByVendorChart';
import { StrategicRecommendationsPanel } from '@/components/intelligence/pages/vendors/StrategicRecommendationsPanel';
import { VendorRoiAnalysisTable } from '@/components/intelligence/pages/vendors/VendorRoiAnalysisTable';
import { vendorIntelligenceMetrics } from '@/lib/mock-data';

export const VendorsPage = () => (
  <div className="space-y-6">
    <MetricCardGrid metrics={vendorIntelligenceMetrics} />

    <VendorRoiAnalysisTable />

    <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
      <RoiByVendorChart />
      <StrategicRecommendationsPanel />
    </div>
  </div>
);
