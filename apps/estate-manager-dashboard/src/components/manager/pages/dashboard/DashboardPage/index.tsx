'use client';

import { MetricCardGrid } from '@repo/dashboard-ui';
import { OperationsAlertBanner } from '@/components/manager/alerts/OperationsAlertBanner';
import { CurrentGuestsTable } from '@/components/manager/pages/dashboard/CurrentGuestsTable';
import { PendingApprovalsTable } from '@/components/manager/pages/dashboard/PendingApprovalsTable';
import { TodaySchedulePanel } from '@/components/manager/pages/dashboard/TodaySchedulePanel';
import { useDashboard } from '@/hooks/useDashboard';
import { mapApprovalItemToPending } from '@/lib/mappers/dashboard';
import { format } from 'date-fns';
import { buildMetrics } from './helpers';

export const DashboardPage = () => {
  const {
    guests,
    kpis,
    alertBanner,
    pendingApprovals,
    todaySchedule,
    isLoading,
    error,
  } = useDashboard();

  const metrics = buildMetrics(kpis);
  const pendingTableRows = pendingApprovals
    .slice(0, 5)
    .map(mapApprovalItemToPending);

  return (
    <div className="space-y-5">
      {alertBanner?.message ? (
        <OperationsAlertBanner
          message={alertBanner.message}
          reviewHref={alertBanner.reviewHref}
        />
      ) : null}

      {alertBanner?.reminders?.map((reminder) => (
        <OperationsAlertBanner
          key={reminder.type}
          message={reminder.message}
          reviewHref="#current-guests"
          reviewLabel="Update status →"
        />
      ))}

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-manager-border"
            />
          ))}
        </div>
      ) : (
        <MetricCardGrid metrics={metrics} variant="manager" columns={4} />
      )}

      <section
        id="current-guests"
        className="grid scroll-mt-24 gap-5 xl:grid-cols-2"
      >
        {isLoading ? (
          <>
            <div className="h-64 animate-pulse rounded-xl bg-manager-border" />
            <div className="h-64 animate-pulse rounded-xl bg-manager-border" />
          </>
        ) : (
          <>
            <CurrentGuestsTable guests={guests} />
            <TodaySchedulePanel items={todaySchedule} />
          </>
        )}
      </section>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-manager-border" />
      ) : (
        <PendingApprovalsTable approvals={pendingTableRows} />
      )}

      {error && (
        <p className="text-sm text-red-500">
          Failed to load dashboard data. Please refresh to try again.
        </p>
      )}
    </div>
  );
};

export function getDashboardSubtitle() {
  return format(new Date(), 'EEEE, MMMM d, yyyy');
}
