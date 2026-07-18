'use client';

import { useSyncExternalStore } from 'react';
import { DashboardCard } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLodgifySyncStatus, useSystemAlerts } from '@/hooks/useSystem';

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-[#f0c4bc] bg-[#fef6f4] text-[#9a3a30]',
  high: 'border-[#f0c4bc] bg-[#fef6f4] text-[#9a3a30]',
  warning: 'border-[#e8d4b8] bg-[#fff8f0] text-[#8b6914]',
  medium: 'border-[#e8d4b8] bg-[#fff8f0] text-[#8b6914]',
  info: 'border-manager-border bg-[#faf9f7] text-manager-text',
  low: 'border-manager-border bg-[#faf9f7] text-manager-text',
};

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60_000;

function subscribeToClock(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, MINUTE_MS);
  return () => window.clearInterval(id);
}

function getClockSnapshot() {
  return Math.floor(Date.now() / MINUTE_MS);
}

function getServerClockSnapshot() {
  return 0;
}

export const SystemHealthPage = () => {
  const { data: sync, isLoading: syncLoading } = useLodgifySyncStatus();
  const { data: alerts, isLoading: alertsLoading } = useSystemAlerts();
  const nowMinute = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );

  const lastSync = sync?.lastSyncAt ? new Date(sync.lastSyncAt) : null;
  const syncHealthy =
    lastSync != null && nowMinute * MINUTE_MS - lastSync.getTime() < HOUR_MS;

  return (
    <div className="font-inter space-y-5">
      {/* Integrations */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardCard variant="manager" className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="size-4 text-manager-text-muted" />
              <h3 className="text-sm font-semibold text-manager-text">
                Lodgify Sync
              </h3>
            </div>
            {!syncLoading && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                  syncHealthy
                    ? 'bg-[#e8f1e9] text-[#3a6448]'
                    : 'bg-[#fff8f0] text-[#8b6914]',
                )}
              >
                <span
                  className={cn(
                    'size-2 rounded-full',
                    syncHealthy ? 'bg-[#4a7c59]' : 'bg-[#b45309]',
                  )}
                />
                {syncHealthy ? 'Healthy' : 'Stale'}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-manager-text-muted">
            {syncLoading
              ? 'Checking…'
              : lastSync
                ? `Last synced ${formatDistanceToNow(lastSync, { addSuffix: true })}`
                : 'No sync recorded yet.'}
          </p>
        </DashboardCard>

        <DashboardCard variant="manager" className="p-5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-manager-text-muted" />
            <h3 className="text-sm font-semibold text-manager-text">API</h3>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#3a6448]">
            <span className="size-2 rounded-full bg-[#4a7c59]" />
            Reachable — dashboard data is loading
          </p>
        </DashboardCard>
      </div>

      {/* System alerts */}
      <DashboardCard
        variant="manager"
        padding={false}
        className="overflow-hidden"
      >
        <div className="border-b border-[#ebe6df] px-5 py-3.5">
          <h3 className="text-sm font-semibold text-manager-text">
            System Alerts
          </h3>
        </div>
        {alertsLoading ? (
          <div className="space-y-2 p-5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-manager-border"
              />
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <ul className="divide-y divide-[#ebe6df]">
            {alerts.map((a) => (
              <li key={a.id} className="px-5 py-3.5">
                <div
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg border px-3 py-2.5',
                    SEVERITY_STYLES[a.severity?.toLowerCase()] ??
                      SEVERITY_STYLES.info,
                  )}
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-sm opacity-90">{a.message}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide opacity-70">
                      {a.category}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <CheckCircle2 className="size-6 text-[#4a7c59]" />
            <p className="text-sm text-manager-text-muted">
              All systems operational — no active alerts.
            </p>
          </div>
        )}
      </DashboardCard>
    </div>
  );
};
