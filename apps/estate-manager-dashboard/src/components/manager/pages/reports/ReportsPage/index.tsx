import { MetricCardGrid } from '@repo/dashboard-ui';

import { ReportsExperiencePopularityCard } from '@/components/manager/pages/reports/ReportsExperiencePopularityCard';
import { ReportsRevenueChart } from '@/components/manager/pages/reports/ReportsRevenueChart';
import { ReportsTopVendorsTable } from '@/components/manager/pages/reports/ReportsTopVendorsTable';
import { ReportsVillaOccupancyCard } from '@/components/manager/pages/reports/ReportsVillaOccupancyCard';
import { reportsSummaryMetrics } from '@/lib/reports-mock-data';

export const ReportsPage = () => (
  <div className="font-inter space-y-6">
    <MetricCardGrid metrics={reportsSummaryMetrics} variant="manager" columns={4} />

    <ReportsRevenueChart />

    <div className="grid gap-6 lg:grid-cols-2">
      <ReportsExperiencePopularityCard />
      <ReportsVillaOccupancyCard />
    </div>

    <ReportsTopVendorsTable />
  </div>
);
