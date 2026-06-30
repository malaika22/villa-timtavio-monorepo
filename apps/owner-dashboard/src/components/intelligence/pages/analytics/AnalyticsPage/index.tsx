import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { AnalyticsMonthlyRevenueChart } from '@/components/intelligence/pages/analytics/AnalyticsMonthlyRevenueChart';
import { EstateOccupancyChart } from '@/components/intelligence/pages/analytics/EstateOccupancyChart';
import { GuestDemographicsSection } from '@/components/intelligence/pages/analytics/GuestDemographicsSection';
import { RevenueByVillaCard } from '@/components/intelligence/pages/analytics/RevenueByVillaCard';
import { RevenueMixDonut } from '@/components/intelligence/pages/analytics/RevenueMixDonut';
import { UnmetDemandCard } from '@/components/intelligence/pages/analytics/UnmetDemandCard';
import { analyticsMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const AnalyticsPage = () => (
  <div className="space-y-6">
    <MockDataBanner message="Revenue trend, occupancy and revenue mix are live; KPI tiles + demographics show sample data." />
    <MetricCardGrid metrics={analyticsMetrics} />

    <AnalyticsMonthlyRevenueChart />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:items-stretch">
      <EstateOccupancyChart />
      <RevenueMixDonut />
    </div>

    <UnmetDemandCard />

    <div className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
      <RevenueByVillaCard />
      <GuestDemographicsSection />
    </div>
  </div>
);
