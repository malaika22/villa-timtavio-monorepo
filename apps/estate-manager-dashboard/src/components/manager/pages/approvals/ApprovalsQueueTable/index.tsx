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
  Input,
} from '@repo/ui';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { Loader2 } from 'lucide-react';

import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { ApprovalStatusPill } from '@/components/manager/pages/approvals/ApprovalStatusPill';
import {
  useApproveRequest,
  useDeclineRequest,
  useConfirmCost,
} from '@/hooks/useApprovals';
import { toast } from 'sonner';
import type { ApprovalQueueItem, ApprovalQueueStatus } from '@/types';

const primaryBtn =
  'h-9 rounded-md border-0 bg-manager-accent px-4 text-sm font-medium text-white shadow-none hover:bg-manager-accent-muted';
const outlineBtn =
  'h-9 rounded-md border-manager-border bg-manager-card px-4 text-sm font-medium text-manager-text shadow-none hover:bg-manager-main';

const isActionable = (status: ApprovalQueueStatus) =>
  status === 'Pending' || status === 'Conflict';

export const ApprovalsQueueTable = ({
  rows,
}: {
  rows: ApprovalQueueItem[];
}) => {
  const approve = useApproveRequest();
  const decline = useDeclineRequest();
  const confirmCost = useConfirmCost();

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [costId, setCostId] = useState<string | null>(null);
  const [costAmount, setCostAmount] = useState('');
  const [costNotes, setCostNotes] = useState('');

  const submitCost = () => {
    const amount = Number(costAmount);
    if (!costId || !amount || amount <= 0) return;
    confirmCost.mutate(
      {
        id: costId,
        dto: { confirmedCost: amount, emNotes: costNotes.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success('Cost logged to folio');
          setCostId(null);
          setCostAmount('');
          setCostNotes('');
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const handleApprove = (id: string) => {
    approve.mutate(
      { id, dto: {} },
      {
        onSuccess: () => toast.success('Experience confirmed'),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  // ─── Batch selection ──────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const actionableIds = rows
    .filter((r) => isActionable(r.status))
    .map((r) => r.id);
  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected =
    actionableIds.length > 0 && actionableIds.every((id) => selected.has(id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(actionableIds));

  const bulkApprove = () => {
    const ids = [...selected].filter((id) => actionableIds.includes(id));
    ids.forEach((id) => approve.mutate({ id, dto: {} }));
    toast.success(`Approving ${ids.length} request(s)`);
    setSelected(new Set());
  };
  const bulkDecline = () => {
    const ids = [...selected].filter((id) => actionableIds.includes(id));
    if (!confirm(`Decline ${ids.length} selected request(s)?`)) return;
    ids.forEach((id) =>
      decline.mutate({ id, dto: { declineReason: 'Declined in bulk' } }),
    );
    toast.success(`Declining ${ids.length} request(s)`);
    setSelected(new Set());
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
      key: 'select',
      header: (
        <input
          type="checkbox"
          aria-label="Select all"
          checked={allSelected}
          onChange={toggleAll}
          className="size-4 accent-manager-accent"
        />
      ) as unknown as string,
      cell: (row) =>
        isActionable(row.status) ? (
          <input
            type="checkbox"
            aria-label={`Select ${row.guestName}`}
            checked={selected.has(row.id)}
            onChange={() => toggleSelected(row.id)}
            className="size-4 accent-manager-accent"
          />
        ) : null,
    },
    {
      key: 'guest',
      header: 'Guest',
      cell: (row) => (
        <div className="flex items-center gap-3 min-w-[160px]">
          <GuestAvatar initials={row.initials} />
          <div>
            <p className="text-sm font-semibold text-manager-text">
              {row.guestName}
            </p>
            <p className="text-sm text-manager-text-muted">
              {row.partyLabel}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
      cell: (row) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-semibold text-manager-text">
            {row.experience}
          </p>
          <p className="text-sm text-manager-text-muted">
            {row.experienceDetail}
          </p>
          {row.status === 'Declined' && row.declineReason ? (
            <p className="mt-0.5 text-xs italic text-[#b42318]">
              “{row.declineReason}”
            </p>
          ) : null}
          {row.status === 'Conflict' ? (
            <p className="mt-0.5 text-xs text-[#b45309]">
              {row.conflictReason ??
                'Resource double-booked — reschedule or decline to resolve.'}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'villa',
      header: 'Villa',
      cell: (row) => (
        <span className="text-sm text-manager-text">{row.villa}</span>
      ),
    },
    {
      key: 'time',
      header: 'Requested Time',
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold text-manager-text">
            {row.requestedDate}
          </p>
          <p className="text-sm text-manager-text-muted">
            {row.requestedTime}
          </p>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      cell: (row) => (
        <span className="text-sm text-manager-text">{row.vendor}</span>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted whitespace-nowrap">
          {row.submitted}
        </span>
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
          // Manager Quote Loop: log the confirmed cost to the folio for
          // confirmed/in-progress experiences.
          if (row.status === 'Confirmed' || row.status === 'In Progress') {
            return (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={outlineBtn}
                onClick={() => {
                  setCostAmount('');
                  setCostNotes('');
                  setCostId(row.id);
                }}
              >
                Log cost
              </Button>
            );
          }
          return <span className="text-sm text-manager-text-muted">—</span>;
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
      {selected.size > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-manager-accent/30 bg-manager-accent/5 px-4 py-2.5">
          <span className="text-sm font-medium text-manager-text">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className={primaryBtn}
              disabled={approve.isPending}
              onClick={bulkApprove}
            >
              Approve all
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={outlineBtn}
              disabled={decline.isPending}
              onClick={bulkDecline}
            >
              Decline all
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm text-manager-text-muted hover:text-manager-text"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        variant="manager"
        striped={false}
      />

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

      <Dialog
        open={!!costId}
        onOpenChange={(open) => {
          if (!open) {
            setCostId(null);
            setCostAmount('');
            setCostNotes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log confirmed cost</DialogTitle>
            <DialogDescription>
              Adds an experience charge to the primary member’s folio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="Amount (USD)"
            />
            <Textarea
              value={costNotes}
              onChange={(e) => setCostNotes(e.target.value)}
              placeholder="Internal note (optional)…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCostId(null);
                setCostAmount('');
                setCostNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={primaryBtn}
              disabled={confirmCost.isPending || !Number(costAmount)}
              onClick={submitCost}
            >
              {confirmCost.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Add to folio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
