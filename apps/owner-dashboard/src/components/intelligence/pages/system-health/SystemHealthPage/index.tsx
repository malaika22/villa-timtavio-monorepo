import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { ActiveSessionsTable } from '@/components/intelligence/pages/system-health/ActiveSessionsTable';
import { RecentIncidentsTable } from '@/components/intelligence/pages/system-health/RecentIncidentsTable';
import { ServiceStatusUptimeSection } from '@/components/intelligence/pages/system-health/ServiceStatusUptimeSection';
import { systemHealthMetrics } from '@/lib/mock-data';

export const SystemHealthPage = () => (
  <div className="space-y-6">
    <MetricCardGrid metrics={systemHealthMetrics} />

    <ServiceStatusUptimeSection />

    <RecentIncidentsTable />
    <ActiveSessionsTable />
  </div>
);
