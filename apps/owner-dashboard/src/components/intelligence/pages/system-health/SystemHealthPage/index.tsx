import { ActiveSessionsTable } from '@/components/intelligence/pages/system-health/ActiveSessionsTable';
import { LiveSystemKpis } from '@/components/intelligence/pages/system-health/LiveSystemKpis';

// KPIs, integration status, 90-day uptime history and incidents are driven by
// real heartbeat telemetry (LiveSystemKpis); the active-sessions table reflects
// in-house guests who have opened their PWA link.
export const SystemHealthPage = () => (
  <div className="space-y-6">
    <LiveSystemKpis />
    <ActiveSessionsTable />
  </div>
);
