import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { AnalyticsMonthlyRevenueChart } from '@/components/intelligence/pages/analytics/AnalyticsMonthlyRevenueChart';
import { EstateOccupancyChart } from '@/components/intelligence/pages/analytics/EstateOccupancyChart';
import { GuestDemographicsSection } from '@/components/intelligence/pages/analytics/GuestDemographicsSection';
import { RevenueByVillaCard } from '@/components/intelligence/pages/analytics/RevenueByVillaCard';
import { analyticsMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const AnalyticsPage = () => (
  <div className="space-y-6">
    <MockDataBanner />
    <MetricCardGrid metrics={analyticsMetrics} />

    <AnalyticsMonthlyRevenueChart />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:items-stretch">
      <EstateOccupancyChart />
      <RevenueByVillaCard />
    </div>

    <GuestDemographicsSection />
  </div>
);
