import Link from 'next/link';
import { Button } from '@repo/ui';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';

import { SectionLinkHeader } from '@/components/manager/ui/SectionLinkHeader';
import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import type { PendingApproval } from '@/types';

const ApprovalStatusPill = ({ status }: { status: PendingApproval['status'] }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
      status === 'Conflict' ? 'bg-manager-danger-bg text-[#c53030]' : 'bg-manager-warning-bg text-[#b45309]',
    )}
  >
    <span
      className={cn(
        'size-2 shrink-0 rounded-full',
        status === 'Conflict' ? 'bg-[#c53030]' : 'bg-[#b45309]',
      )}
    />
    {status}
  </span>
);

export const PendingApprovalsTable = ({
  approvals,
  showSectionHeader = true,
}: {
  approvals: PendingApproval[];
  showSectionHeader?: boolean;
}) => {
  const columns: DataTableColumn<PendingApproval>[] = [
    {
      key: 'guest',
      header: 'Guest',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <GuestAvatar initials={row.initials} />
          <div>
            <p className="font-semibold text-manager-text">{row.guestName}</p>
            <p className="text-sm text-manager-text-muted">{row.villa}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
      cell: (row) => <span className="text-manager-text">{row.experience}</span>,
    },
    {
      key: 'time',
      header: 'Requested Time',
      cell: (row) => <span className="text-sm text-manager-text-muted">{row.requestedTime}</span>,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (row) => <span className="text-sm text-manager-text-muted">{row.submitted}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <ApprovalStatusPill status={row.status} />,
    },
    {
      key: 'action',
      header: '',
      cell: (row) => (
        <Button
          asChild
          size="sm"
          variant={row.status === 'Conflict' ? 'default' : 'outline'}
          className={cn(
            'h-9 min-w-[80px] rounded-md px-4 text-sm font-medium',
            row.status === 'Conflict'
              ? 'border-0 bg-manager-accent text-white shadow-none hover:bg-manager-accent-muted'
              : 'border-manager-border bg-manager-card text-manager-text shadow-none hover:bg-manager-main',
          )}
        >
          <Link href="/approvals">Review</Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      {showSectionHeader ? (
        <SectionLinkHeader title="Pending Approvals" href="/approvals" linkLabel="Review all →" />
      ) : null}
      <DataTable columns={columns} rows={approvals} variant="manager" striped={false} />
    </div>
  );
};
