import { AnalyticsMonthlyRevenueChart } from '@/components/intelligence/pages/analytics/AnalyticsMonthlyRevenueChart';
import { EstateOccupancyChart } from '@/components/intelligence/pages/analytics/EstateOccupancyChart';
import { LiveRevenueKpis } from '@/components/intelligence/pages/analytics/LiveRevenueKpis';
import { RevenueMixDonut } from '@/components/intelligence/pages/analytics/RevenueMixDonut';
import { UnmetDemandCard } from '@/components/intelligence/pages/analytics/UnmetDemandCard';

export const AnalyticsPage = () => (
  <div className="space-y-6">
    <LiveRevenueKpis />

    <AnalyticsMonthlyRevenueChart />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:items-stretch">
      <EstateOccupancyChart />
      <RevenueMixDonut />
    </div>

    <UnmetDemandCard />
  </div>
);
