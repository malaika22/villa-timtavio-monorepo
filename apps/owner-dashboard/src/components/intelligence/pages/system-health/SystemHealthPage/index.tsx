import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { ActiveSessionsTable } from '@/components/intelligence/pages/system-health/ActiveSessionsTable';
import { RecentIncidentsTable } from '@/components/intelligence/pages/system-health/RecentIncidentsTable';
import { ServiceStatusUptimeSection } from '@/components/intelligence/pages/system-health/ServiceStatusUptimeSection';
import { systemHealthMetrics } from '@/lib/mock-data';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const SystemHealthPage = () => (
  <div className="space-y-6">
    <MockDataBanner />
    <MetricCardGrid metrics={systemHealthMetrics} />

    <ServiceStatusUptimeSection />

    <RecentIncidentsTable />
    <ActiveSessionsTable />
  </div>
);
