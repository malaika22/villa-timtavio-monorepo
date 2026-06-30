import { ActiveSessionsTable } from '@/components/intelligence/pages/system-health/ActiveSessionsTable';
import { LiveSystemKpis } from '@/components/intelligence/pages/system-health/LiveSystemKpis';
import { RecentIncidentsTable } from '@/components/intelligence/pages/system-health/RecentIncidentsTable';
import { ServiceStatusUptimeSection } from '@/components/intelligence/pages/system-health/ServiceStatusUptimeSection';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const SystemHealthPage = () => (
  <div className="space-y-6">
    <MockDataBanner message="KPIs and integration status are live. 90-day uptime history and incidents show sample data." />
    <LiveSystemKpis />

    <ServiceStatusUptimeSection />

    <RecentIncidentsTable />
    <ActiveSessionsTable />
  </div>
);
