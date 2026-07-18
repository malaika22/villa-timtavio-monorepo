'use client';

import { Button } from '@repo/ui';
import { toast } from 'sonner';

import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { useApproveRequest, useDeclineRequest } from '@/hooks/useApprovals';
import type { ApprovalQueueItem, ApprovalQueueStatus } from '@/types';

const COLUMNS: { status: ApprovalQueueStatus; label: string; tint: string }[] =
  [
    { status: 'Pending', label: 'Pending', tint: 'bg-[#fef6eb]' },
    { status: 'Confirmed', label: 'Confirmed', tint: 'bg-[#eef4ff]' },
    { status: 'In Progress', label: 'In Progress', tint: 'bg-[#f0f7f2]' },
  ];

export const ApprovalsKanban = ({ rows }: { rows: ApprovalQueueItem[] }) => {
  const approve = useApproveRequest();
  const decline = useDeclineRequest();

  const byStatus = (s: ApprovalQueueStatus) =>
    rows.filter(
      (r) => r.status === s || (s === 'Pending' && r.status === 'Conflict'),
    );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = byStatus(col.status);
        return (
          <div key={col.status} className="flex flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-manager-text">
                {col.label}
              </h3>
              <span className="text-xs text-manager-text-muted">
                {items.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl border border-manager-border bg-manager-card p-2">
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-manager-text-muted">
                  Nothing here.
                </p>
              ) : (
                items.map((row) => (
                  <article
                    key={row.id}
                    className={`rounded-lg ${col.tint} p-3`}
                  >
                    <div className="flex items-center gap-2">
                      <GuestAvatar initials={row.initials} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-manager-text">
                          {row.guestName}
                        </p>
                        <p className="truncate text-xs text-manager-text-muted">
                          {row.experience}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-manager-text-muted">
                      {row.requestedDate} · {row.requestedTime}
                    </p>
                    {(row.status === 'Pending' ||
                      row.status === 'Conflict') && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 flex-1 rounded-md border-0 bg-manager-accent text-xs text-white hover:bg-manager-accent-muted"
                          disabled={approve.isPending}
                          onClick={() =>
                            approve.mutate(
                              { id: row.id, dto: {} },
                              {
                                onSuccess: () => toast.success('Confirmed'),
                                onError: (e) =>
                                  toast.error((e as Error).message),
                              },
                            )
                          }
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 rounded-md border-manager-border text-xs"
                          disabled={decline.isPending}
                          onClick={() =>
                            decline.mutate(
                              { id: row.id, dto: { declineReason: undefined } },
                              {
                                onSuccess: () => toast.success('Declined'),
                                onError: (e) =>
                                  toast.error((e as Error).message),
                              },
                            )
                          }
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
