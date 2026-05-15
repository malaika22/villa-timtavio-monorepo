import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { ActiveSessionsTable } from '@/components/intelligence/pages/system-health/ActiveSessionsTable';
import { RecentIncidentsTable } from '@/components/intelligence/pages/system-health/RecentIncidentsTable';
import { ServiceStatusUptimeSection } from '@/components/intelligence/pages/system-health/ServiceStatusUptimeSection';
import { systemHealthMetrics } from '@/lib/mock-data';

/** Owner Screen 7 — System Health (Figma node 268:2508) */
export const SystemHealthPage = () => (
  <div className="space-y-6">
    <MetricCardGrid metrics={systemHealthMetrics} />

    <ServiceStatusUptimeSection />

    <RecentIncidentsTable />
    <ActiveSessionsTable />
  </div>
);
