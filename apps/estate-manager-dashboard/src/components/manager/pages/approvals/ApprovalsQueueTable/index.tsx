'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@repo/ui';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';
import { Loader2 } from 'lucide-react';

import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { ApprovalStatusPill } from '@/components/manager/pages/approvals/ApprovalStatusPill';
import { useApproveRequest, useDeclineRequest } from '@/hooks/useApprovals';
import { toast } from 'sonner';
import type { ApprovalQueueItem, ApprovalQueueStatus } from '@/types';

const primaryBtn =
  'h-9 rounded-md border-0 bg-manager-accent px-4 text-sm font-medium text-white shadow-none hover:bg-manager-accent-muted';
const outlineBtn =
  'h-9 rounded-md border-manager-border bg-manager-card px-4 text-sm font-medium text-manager-text shadow-none hover:bg-manager-main';

const isActionable = (status: ApprovalQueueStatus) =>
  status === 'Pending' || status === 'Conflict';

export const ApprovalsQueueTable = ({ rows }: { rows: ApprovalQueueItem[] }) => {
  const approve = useApproveRequest();
  const decline = useDeclineRequest();

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const handleApprove = (id: string) => {
    approve.mutate(
      { id, dto: {} },
      {
        onSuccess: () => toast.success('Experience confirmed'),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const submitDecline = () => {
    if (!decliningId) return;
    decline.mutate(
      { id: decliningId, dto: { declineReason: reason.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success('Request declined');
          setDecliningId(null);
          setReason('');
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

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
          {row.status === 'Declined' && row.declineReason ? (
            <p className="mt-0.5 text-xs italic text-[#b42318]">
              “{row.declineReason}”
            </p>
          ) : null}
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
        if (!isActionable(row.status)) {
          return <span className="text-[15px] text-manager-text-muted">—</span>;
        }
        const busy =
          (approve.isPending && approve.variables?.id === row.id) ||
          (decline.isPending && decliningId === row.id);
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className={primaryBtn}
              disabled={busy}
              onClick={() => handleApprove(row.id)}
            >
              {busy && approve.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : row.status === 'Conflict' ? (
                'Resolve'
              ) : (
                'Confirm'
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={outlineBtn}
              disabled={busy}
              onClick={() => {
                setReason('');
                setDecliningId(row.id);
              }}
            >
              Decline
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} rows={rows} variant="manager" striped={false} />

      <Dialog
        open={!!decliningId}
        onOpenChange={(open) => {
          if (!open) {
            setDecliningId(null);
            setReason('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline request</DialogTitle>
            <DialogDescription>
              The guest is notified. Add an optional reason — it’s shown to the
              guest and kept on the request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)…"
            rows={4}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDecliningId(null);
                setReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#b42318] text-white hover:bg-[#911c13]"
              disabled={decline.isPending}
              onClick={submitDecline}
            >
              {decline.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Decline request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
