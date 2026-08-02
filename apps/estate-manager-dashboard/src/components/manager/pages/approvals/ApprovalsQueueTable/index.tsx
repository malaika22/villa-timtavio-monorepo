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
import type { DataTableColumn, DataTableGroup } from '@repo/dashboard-ui';
import { ChevronDown, Loader2 } from 'lucide-react';

import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { ApprovalStatusPill } from '@/components/manager/pages/approvals/ApprovalStatusPill';
import {
  useApproveRequest,
  useDeclineRequest,
  useConfirmCost,
} from '@/hooks/useApprovals';
import { toast } from 'sonner';
import {
  formatPrice,
  formatRateRange,
  quoteApprovalCeiling,
  quoteNeedsReapproval,
} from '@repo/api-types';
import type { ApprovalQueueItem, ApprovalQueueStatus } from '@/types';
import type { StayGroup } from '@/components/manager/pages/approvals/ApprovalsPage/helpers';

const primaryBtn =
  'h-9 rounded-md border-0 bg-manager-accent px-4 text-sm font-medium text-white shadow-none hover:bg-manager-accent-muted';
const outlineBtn =
  'h-9 rounded-md border-manager-border bg-manager-card px-4 text-sm font-medium text-manager-text shadow-none hover:bg-manager-main';

const isActionable = (status: ApprovalQueueStatus) =>
  status === 'Pending' || status === 'Conflict';

export const ApprovalsQueueTable = ({
  rows,
  stayGroups,
}: {
  rows: ApprovalQueueItem[];
  /** Present in the grouped view; the flat `rows` still drive the dialogs. */
  stayGroups?: StayGroup[];
}) => {
  const approve = useApproveRequest();
  const decline = useDeclineRequest();
  const confirmCost = useConfirmCost();

  // Collapsed by booking id, so a stay stays shut as the queue refetches.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleGroup = (bookingId: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });

  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [costId, setCostId] = useState<string | null>(null);
  const [costAmount, setCostAmount] = useState('');
  const [costNotes, setCostNotes] = useState('');

  // The guest approved an estimate; a quote materially above it goes back to the
  // primary rather than to the folio. Surface that before the EM commits.
  const costRow = rows.find((r) => r.id === costId);
  // Once a price is agreed, that is what the guest consented to — a revision is
  // judged against it, not against the original estimate. Mirrors the server.
  const alreadyPriced = costRow?.confirmedCost != null;
  const estimateMax = alreadyPriced
    ? costRow!.confirmedCost!
    : (costRow?.estimatedMax ?? null);
  const enteredCost = Number(costAmount);
  const ceiling = estimateMax != null ? quoteApprovalCeiling(estimateMax) : null;
  const willNeedReapproval =
    !!enteredCost && quoteNeedsReapproval(enteredCost, estimateMax);
  // Reschedule a conflicted request onto a new (non-overlapping) slot.
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const submitReschedule = () => {
    if (!rescheduleId || !rescheduleDate) return;
    approve.mutate(
      {
        id: rescheduleId,
        dto: {
          confirmedDate: rescheduleDate,
          confirmedTime: rescheduleTime || undefined,
        },
      },
      {
        onSuccess: () => {
          // If the new slot still clashes the backend keeps it in CONFLICT and
          // the queue refetch shows the updated reason — so keep this neutral.
          toast.success('Reschedule applied');
          setRescheduleId(null);
          setRescheduleDate('');
          setRescheduleTime('');
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

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
          toast.success(
            willNeedReapproval
              ? 'Quote sent to the primary member for approval'
              : 'Cost logged to folio',
          );
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
              onClick={() => {
                if (row.status === 'Conflict') {
                  // Re-confirming the same slot just re-conflicts — reschedule.
                  setRescheduleDate('');
                  setRescheduleTime('');
                  setRescheduleId(row.id);
                } else {
                  handleApprove(row.id);
                }
              }}
            >
              {busy && approve.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : row.status === 'Conflict' ? (
                'Reschedule'
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

  // Soonest arrival leads, so the party closest to the door is flagged. Only
  // the leader — flagging several would flag nothing.
  const leadBookingId = stayGroups?.[0]?.bookingId;

  const groups: DataTableGroup<ApprovalQueueItem>[] | undefined =
    stayGroups?.map((group) => ({
      key: group.bookingId,
      rows: group.items,
      collapsed: collapsed.has(group.bookingId),
      header: (
        <button
          type="button"
          onClick={() => toggleGroup(group.bookingId)}
          aria-expanded={!collapsed.has(group.bookingId)}
          className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 bg-[#faf6ee] px-5 py-3 text-left hover:bg-[#f6f0e4]"
        >
          <ChevronDown
            className={`size-4 shrink-0 self-center text-manager-text-muted transition-transform ${
              collapsed.has(group.bookingId) ? '-rotate-90' : ''
            }`}
            aria-hidden
          />
          <span className="text-[15px] font-semibold text-manager-text">
            {group.stayLabel}
          </span>
          {group.stayDates ? (
            <span className="text-xs text-manager-text-muted">
              {group.stayDates}
            </span>
          ) : null}
          <span className="text-xs text-manager-text-muted">
            {group.openCount} open
            {group.awaitingPrice > 0
              ? ` · ${group.awaitingPrice} awaiting a price`
              : ''}
          </span>
          {group.bookingId === leadBookingId && group.checkIn != null ? (
            <span className="ml-auto rounded border border-manager-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-manager-accent">
              Next arrival
            </span>
          ) : null}
        </button>
      ),
    }));

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        groups={groups}
        variant="manager"
        striped={false}
        emptyState={
          <span className="text-manager-text-muted">
            No experience requests to review.
          </span>
        }
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
            <DialogTitle>Log final quote</DialogTitle>
            <DialogDescription>
              {estimateMax != null
                ? 'Charges the requesting guest’s line on the folio. Stays within the approved estimate and it posts straight away.'
                : 'Adds an experience charge to the primary member’s folio.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {estimateMax != null && (
              <div className="rounded-md border border-manager-border bg-manager-main px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-manager-text-muted">
                    {alreadyPriced
                      ? 'Price the guest approved'
                      : 'Estimate the guest approved'}
                  </span>
                  <span className="font-medium tabular-nums text-manager-text">
                    {alreadyPriced
                      ? formatPrice(costRow!.confirmedCost!)
                      : formatRateRange(
                          costRow?.estimatedMin,
                          costRow?.estimatedMax,
                        )}
                  </span>
                </div>
                {ceiling != null && (
                  <p className="mt-1 text-xs text-manager-text-muted">
                    Posts without re-approval up to {formatPrice(ceiling)}.
                  </p>
                )}
              </div>
            )}
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="Final quote (USD)"
            />
            {willNeedReapproval && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {formatPrice(enteredCost)} is above the approved estimate. This
                goes back to the primary member for approval — nothing is charged
                until they confirm.
              </p>
            )}
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
              {willNeedReapproval ? 'Send for approval' : 'Add to folio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rescheduleId}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleId(null);
            setRescheduleDate('');
            setRescheduleTime('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule &amp; confirm</DialogTitle>
            <DialogDescription>
              This experience clashes with another booking for the same
              vendor/resource. Pick a new time to free the slot, then confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-manager-text-muted">
                New date
              </label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-manager-text-muted">
                New time
              </label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRescheduleId(null);
                setRescheduleDate('');
                setRescheduleTime('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={primaryBtn}
              disabled={approve.isPending || !rescheduleDate}
              onClick={submitReschedule}
            >
              {approve.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Reschedule &amp; confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
