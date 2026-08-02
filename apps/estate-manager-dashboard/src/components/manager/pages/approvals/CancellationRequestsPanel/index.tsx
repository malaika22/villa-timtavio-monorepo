'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2, XCircle } from 'lucide-react';
import { Button, Input } from '@repo/ui';
import { toast } from 'sonner';
import { formatPrice } from '@repo/api-types';

import {
  useCancellationRequests,
  useConfirmCancellation,
} from '@/hooks/useApprovals';

/**
 * Experiences a guest has asked to drop after the estate had already arranged
 * them. Sits above the queue because a supplier is booked and the date is
 * coming — this is time-sensitive in a way a new request isn't.
 *
 * Confirming here removes the experience's folio charge and records whatever
 * the supplier charged for the late change, against the guest who asked.
 */
export const CancellationRequestsPanel = () => {
  const { data: requests = [] } = useCancellationRequests();
  const confirm = useConfirmCancellation();
  const [fees, setFees] = useState<Record<string, string>>({});

  if (requests.length === 0) return null;

  const submit = (id: string, experience: string) => {
    const raw = fees[id]?.trim();
    const fee = raw ? Number(raw) : undefined;
    if (raw && (!Number.isFinite(fee) || fee! < 0)) {
      toast.error('Enter a valid cancellation fee, or leave it empty');
      return;
    }
    confirm.mutate(
      { id, fee },
      {
        onSuccess: () => {
          toast.success(`${experience} cancelled`, {
            description: fee
              ? `${formatPrice(fee)} fee charged to the guest.`
              : 'No fee charged.',
          });
          setFees((f) => ({ ...f, [id]: '' }));
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <section className="mb-5 rounded-xl border border-amber-300 bg-amber-50/70 p-5">
      <div className="flex items-start gap-2">
        <XCircle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
        <div>
          <h2 className="text-sm font-semibold text-amber-900">
            {requests.length} cancellation
            {requests.length === 1 ? '' : 's'} requested
          </h2>
          <p className="mt-0.5 text-sm text-amber-800/80">
            Unwind each with the supplier, then confirm below. Any fee they
            charge goes on the guest&apos;s folio; the original charge comes off.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {requests.map((r) => {
          const busy = confirm.isPending && confirm.variables?.id === r.id;
          const experience = r.catalogItem?.name ?? 'Experience';
          return (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-manager-text">
                  {experience}
                </p>
                <p className="mt-0.5 text-xs text-manager-text-muted">
                  {r.requestedByName}
                  {r.confirmedDate
                    ? ` · ${format(parseISO(r.confirmedDate), 'MMM d')}`
                    : ''}
                  {r.confirmedCost != null
                    ? ` · ${formatPrice(r.confirmedCost)} on folio`
                    : ' · not yet priced'}
                </p>
                {r.cancellationReason ? (
                  <p className="mt-1 text-xs italic text-manager-text-muted">
                    “{r.cancellationReason}”
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={fees[r.id] ?? ''}
                  onChange={(e) =>
                    setFees((f) => ({ ...f, [r.id]: e.target.value }))
                  }
                  placeholder="Fee (optional)"
                  className="w-36"
                />
                <Button
                  type="button"
                  onClick={() => submit(r.id, experience)}
                  disabled={busy}
                  className="bg-manager-accent text-white hover:opacity-90"
                >
                  {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                  Confirm cancellation
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
