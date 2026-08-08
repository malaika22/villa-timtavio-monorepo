'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Loader2, MessageCircle, XCircle } from 'lucide-react';
import { Button, Input } from '@repo/ui';
import { toast } from 'sonner';
import { formatPrice, vendorCancellationStage } from '@repo/api-types';

import {
  useCancellationRequests,
  useConfirmCancellation,
  useMarkVendorCancelSent,
  useRecordVendorCancelReply,
  useVendorCancelMessage,
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
  const markTold = useMarkVendorCancelSent();
  const recordReply = useRecordVendorCancelReply();
  const [fees, setFees] = useState<Record<string, string>>({});
  // Which row's WhatsApp draft to fetch. One at a time, on demand — the panel
  // shouldn't compose a message for every cancellation just in case.
  const [drafting, setDrafting] = useState<string | null>(null);
  const { data: draft } = useVendorCancelMessage(drafting);

  const tellVendor = (id: string) => {
    if (!draft || drafting !== id) {
      setDrafting(id);
      return;
    }
    window.open(draft.whatsappUrl, '_blank', 'noopener,noreferrer');
    markTold.mutate(id);
    setDrafting(null);
  };

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
            Tell the vendor, record what they said about a fee, then confirm.
            The original charge comes off the folio and their fee goes on —
            which is why the number wants to come from them rather than from
            memory.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {requests.map((r) => {
          const busy = confirm.isPending && confirm.variables?.id === r.id;
          const experience = r.catalogItem?.name ?? 'Experience';
          const stage = vendorCancellationStage(r);
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

                {/* A warning, not a block. A guest cancelling three weeks out
                    may involve no vendor conversation worth stopping for — but
                    nobody should confirm one without noticing. */}
                {stage === 'NOT_TOLD' && (
                  <p className="mt-1 text-xs font-medium text-[#b42318]">
                    {r.catalogItem?.vendor?.name ?? 'The vendor'} hasn’t been
                    told yet
                  </p>
                )}
                {stage === 'TOLD' && (
                  <p className="mt-1 text-xs text-[#8a6d3b]">
                    Told — waiting on whether they’re charging
                  </p>
                )}
                {stage === 'SETTLED' && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#3a6448]">
                    <Check className="size-3" />
                    {r.cancellationFee
                      ? `${r.catalogItem?.vendor?.name ?? 'The vendor'} is charging ${formatPrice(Number(r.cancellationFee))}`
                      : 'No charge from the vendor'}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {stage !== 'NONE' && stage !== 'SETTLED' && (
                  <Button
                    type="button"
                    onClick={() => tellVendor(r.id)}
                    disabled={markTold.isPending}
                    className="bg-[#1f7a5c] text-white hover:opacity-90"
                  >
                    <MessageCircle className="mr-1.5 size-4" />
                    {drafting === r.id
                      ? 'Open WhatsApp'
                      : stage === 'TOLD'
                        ? 'Tell them again'
                        : 'Tell the vendor'}
                  </Button>
                )}

                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={fees[r.id] ?? ''}
                  onChange={(e) =>
                    setFees((f) => ({ ...f, [r.id]: e.target.value }))
                  }
                  placeholder="Their fee"
                  className="w-32"
                />

                {stage !== 'NONE' && stage !== 'SETTLED' && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-manager-border bg-white text-manager-text"
                    disabled={recordReply.isPending}
                    onClick={() => {
                      const raw = fees[r.id]?.trim();
                      recordReply.mutate({
                        id: r.id,
                        dto: { fee: raw ? Number(raw) : undefined },
                      });
                    }}
                  >
                    Record their answer
                  </Button>
                )}

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
