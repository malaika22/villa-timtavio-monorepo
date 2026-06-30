import { LiveSystemKpis } from '@/components/intelligence/pages/system-health/LiveSystemKpis';

// All sections (KPIs, integration status, 90-day uptime history, incidents)
// are now driven by real heartbeat telemetry via LiveSystemKpis.
export const SystemHealthPage = () => (
  <div className="space-y-6">
    <LiveSystemKpis />
  </div>
);
