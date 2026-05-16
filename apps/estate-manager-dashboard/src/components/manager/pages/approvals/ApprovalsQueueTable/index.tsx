'use client';

import { Button } from '@repo/ui';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';

import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { ApprovalStatusPill } from '@/components/manager/pages/approvals/ApprovalStatusPill';
import type { ApprovalQueueItem, ApprovalQueueStatus } from '@/types';

const primaryBtn =
  'h-9 rounded-md border-0 bg-manager-accent px-4 text-sm font-medium text-white shadow-none hover:bg-manager-accent-muted';
const outlineBtn =
  'h-9 rounded-md border-manager-border bg-manager-card px-4 text-sm font-medium text-manager-text shadow-none hover:bg-manager-main';

function getActions(status: ApprovalQueueStatus) {
  switch (status) {
    case 'Conflict':
      return { primary: 'Resolve', secondary: 'Decline' };
    case 'Pending':
      return { primary: 'Confirm', secondary: 'Decline' };
    default:
      return { primary: 'View', secondary: null };
  }
}

export const ApprovalsQueueTable = ({ rows }: { rows: ApprovalQueueItem[] }) => {
  const columns: DataTableColumn<ApprovalQueueItem>[] = [
    {
      key: 'guest',
      header: 'Guest',
      cell: (row) => (
        <div className="flex items-center gap-3 min-w-[160px]">
          <GuestAvatar initials={row.initials} />
          <div>
            <p className="text-sm font-semibold text-manager-text">{row.guestName}</p>
            <p className="text-[15px] text-manager-text-muted">{row.partyLabel}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
      cell: (row) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-semibold text-manager-text">{row.experience}</p>
            <p className="text-[15px] text-manager-text-muted">{row.experienceDetail}</p>
        </div>
      ),
    },
    {
      key: 'villa',
      header: 'Villa',
      cell: (row) => <span className="text-sm text-manager-text">{row.villa}</span>,
    },
    {
      key: 'time',
      header: 'Requested Time',
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold text-manager-text">{row.requestedDate}</p>
          <p className="text-[15px] text-manager-text-muted">{row.requestedTime}</p>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      cell: (row) => <span className="text-sm text-manager-text">{row.vendor}</span>,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (row) => (
        <span className="text-[15px] text-manager-text-muted whitespace-nowrap">{row.submitted}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <ApprovalStatusPill status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => {
        const { primary, secondary } = getActions(row.status);
        const isViewOnly = secondary === null;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={isViewOnly ? 'outline' : 'default'}
              className={cn(isViewOnly ? outlineBtn : primaryBtn)}
            >
              {primary}
            </Button>
            {secondary ? (
              <Button type="button" size="sm" variant="outline" className={outlineBtn}>
                {secondary}
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} rows={rows} variant="manager" striped={false} />;
};
