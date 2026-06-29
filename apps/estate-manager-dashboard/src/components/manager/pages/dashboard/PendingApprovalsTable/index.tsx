'use client';

import Link from 'next/link';
import { Button } from '@repo/ui';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';

import { SectionLinkHeader } from '@/components/manager/ui/SectionLinkHeader';
import { SectionEmptyState } from '@/components/manager/ui/SectionEmptyState';
import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { useApproveRequest, useDeclineRequest } from '@/hooks/useApprovals';
import type { PendingApproval } from '@/types';

const ApprovalStatusPill = ({
  status,
}: {
  status: PendingApproval['status'];
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
      status === 'Conflict'
        ? 'bg-manager-danger-bg text-[#c53030]'
        : 'bg-manager-warning-bg text-[#b45309]',
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
  const approve = useApproveRequest();
  const decline = useDeclineRequest();

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
      cell: (row) => (
        <div>
          <p className="text-manager-text">{row.experience}</p>
          <p className="text-sm text-manager-text-muted">{row.vendor}</p>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Requested Time',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">
          {row.requestedTime}
        </span>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">{row.submitted}</span>
      ),
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
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            className="h-8 rounded-md border-0 bg-manager-accent px-3 text-xs font-medium text-white shadow-none hover:bg-manager-accent-muted"
            disabled={approve.isPending}
            onClick={() =>
              approve.mutate(
                { id: row.id, dto: {} },
                {
                  onSuccess: () => toast.success('Confirmed'),
                  onError: (e) => toast.error((e as Error).message),
                },
              )
            }
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-md border-manager-border px-3 text-xs font-medium text-manager-text shadow-none hover:bg-manager-main"
            disabled={decline.isPending}
            onClick={() =>
              decline.mutate(
                { id: row.id, dto: { declineReason: undefined } },
                {
                  onSuccess: () => toast.success('Declined'),
                  onError: (e) => toast.error((e as Error).message),
                },
              )
            }
          >
            Decline
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-manager-text-muted hover:text-manager-text"
          >
            <Link href={`/approvals?request=${row.id}`}>Review</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {showSectionHeader ? (
        <SectionLinkHeader
          title="Pending Approvals"
          href="/approvals"
          linkLabel="Review all →"
        />
      ) : null}
      {approvals.length === 0 ? (
        <SectionEmptyState
          message="No pending approvals"
          description="Experience requests awaiting estate manager review will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={approvals}
          variant="manager"
          striped={false}
        />
      )}
    </div>
  );
};
