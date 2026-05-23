import { MetricCardGrid } from '@repo/dashboard-ui';

import { OperationsAlertBanner } from '@/components/manager/alerts/OperationsAlertBanner';
import { CurrentGuestsTable } from '@/components/manager/pages/dashboard/CurrentGuestsTable';
import { PendingApprovalsTable } from '@/components/manager/pages/dashboard/PendingApprovalsTable';
import { TodaySchedulePanel } from '@/components/manager/pages/dashboard/TodaySchedulePanel';
import {
  currentGuests,
  dashboardMetrics,
  operationsAlertMessage,
  pendingApprovals,
  todaySchedule,
} from '@/lib/mock-data';

export const DashboardPage = () => (
  <div className="space-y-5">
    <OperationsAlertBanner message={operationsAlertMessage} />
    <MetricCardGrid metrics={dashboardMetrics} variant="manager" columns={4} />

    <section className="grid gap-5 xl:grid-cols-2">
      <CurrentGuestsTable guests={currentGuests} />
      <TodaySchedulePanel items={todaySchedule} />
    </section>

    <PendingApprovalsTable approvals={pendingApprovals} />
  </div>
);
