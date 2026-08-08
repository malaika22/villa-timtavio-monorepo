'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, MessageCircle, X } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import { formatPrice } from '@repo/api-types';
import type { VendorReplyOutcome } from '@repo/api-types';
import type { ApprovalQueueItem } from '@/types';

import {
  useMarkVendorAsked,
  useRecordVendorReply,
  useVendorMessage,
} from '@/hooks/useApprovals';

type Step = 'ask' | 'reply';

const OUTCOMES: {
  key: VendorReplyOutcome;
  label: string;
  sub: string;
}[] = [
  {
    key: 'CONFIRMED',
    label: 'They can do it',
    sub: 'Enter the price they quoted',
  },
  {
    key: 'ALTERNATIVE',
    label: 'They offered another time',
    sub: 'The guest decides whether to take it',
  },
  {
    key: 'DECLINED',
    label: 'They can’t',
    sub: 'The guest is told, with your reason',
  },
];

/**
 * Asking the vendor, and writing down what they said.
 *
 * Two steps rather than one screen, because they happen minutes or hours
 * apart: the estate sends a WhatsApp message, goes and does something else,
 * and comes back when the vendor answers. A single form would have to be
 * abandoned half-filled every time.
 */
export const VendorBookingDialog = ({
  request,
  step,
  onOpenChange,
}: {
  /** The queue row — everything this needs is already on it. */
  request: ApprovalQueueItem | null;
  step: Step;
  onOpenChange: (open: boolean) => void;
}) => {
  const { data: draft, isLoading, error } = useVendorMessage(
    step === 'ask' ? (request?.id ?? null) : null,
  );
  const markAsked = useMarkVendorAsked();
  const record = useRecordVendorReply();

  const [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState<VendorReplyOutcome>('CONFIRMED');
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  useEffect(() => {
    if (draft?.message) setMessage(draft.message);
  }, [draft?.message]);

  // Each opening starts clean. A price typed for one request must never be
  // sitting in the box when the estate opens the next one.
  useEffect(() => {
    if (!request) return;
    setOutcome('CONFIRMED');
    setCost('');
    setNote('');
    setProposedDate('');
    setProposedTime('');
  }, [request?.id, step]);

  if (!request) return null;

  const vendorName = request.vendorName ?? 'the vendor';
  const estimate =
    request.estimatedMax != null
      ? Number(request.estimatedMax)
      : request.estimatedMin != null
        ? Number(request.estimatedMin)
        : null;
  const over =
    outcome !== 'DECLINED' &&
    estimate != null &&
    cost !== '' &&
    Number(cost) > estimate;

  const send = () => {
    if (!draft) return;
    // Whatever the estate edited is what gets sent, not the draft we composed.
    const url = `https://wa.me/${draft.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    markAsked.mutate(request.id, { onSuccess: () => onOpenChange(false) });
  };

  const save = () =>
    record.mutate(
      {
        id: request.id,
        dto: {
          outcome,
          quotedCost: cost === '' ? undefined : Number(cost),
          note: note.trim() || undefined,
          proposedDate: outcome === 'ALTERNATIVE' ? proposedDate : undefined,
          proposedTime: outcome === 'ALTERNATIVE' ? proposedTime : undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'ask' ? `Ask ${vendorName}` : `What did ${vendorName} say?`}
          </DialogTitle>
          <DialogDescription>
            {request.experience} · {request.requestedDate} at{' '}
            {request.requestedTime} · {request.partyLabel}
          </DialogDescription>
        </DialogHeader>

        {step === 'ask' ? (
          <div className="min-w-0 space-y-3">
            {isLoading ? (
              <div className="h-40 animate-pulse rounded-lg bg-manager-border" />
            ) : error ? (
              <div className="rounded-lg border border-[#f4c8c1] bg-[#fdf3f1] px-3 py-2.5 text-xs text-[#8f2b21]">
                {(error as Error).message}
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-manager-text-muted">
                    To {draft?.vendorName} · {draft?.phone}
                  </label>
                  {/* Editable on purpose. The estate knows this vendor and we
                      don't — a stock message they can't adjust is a message
                      they'd rather retype elsewhere. */}
                  <Textarea
                    rows={9}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1.5 text-xs leading-relaxed"
                  />
                </div>

                <p className="text-xs text-manager-text-muted">
                  Opens in your own WhatsApp so {draft?.vendorName} sees a
                  person, not an integration. Marking it asked tells the guest
                  we&rsquo;re arranging it.
                </p>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(message);
                      toast.success('Message copied');
                    }}
                    className="border-manager-border bg-white text-manager-text"
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    onClick={send}
                    disabled={markAsked.isPending}
                    className="bg-[#1f7a5c] text-white hover:opacity-90"
                  >
                    {markAsked.isPending ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <MessageCircle className="mr-1.5 size-4" />
                    )}
                    Open WhatsApp &amp; mark asked
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="min-w-0 space-y-3">
            <div className="space-y-1.5">
              {OUTCOMES.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setOutcome(o.key)}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left',
                    outcome === o.key
                      ? 'border-[#1f7a5c] bg-[#eaf4ef]'
                      : 'border-manager-border bg-white hover:bg-[#faf9f7]',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                      outcome === o.key
                        ? 'border-[#1f7a5c] bg-[#1f7a5c] text-white'
                        : 'border-manager-border',
                    )}
                    aria-hidden
                  >
                    {outcome === o.key && (
                      <Check className="size-2.5" strokeWidth={3} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-manager-text">
                      {o.label}
                    </span>
                    <span className="block text-[11px] text-manager-text-muted">
                      {o.sub}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {outcome === 'ALTERNATIVE' && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-manager-text-muted">
                    Date they offered
                  </label>
                  <Input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-manager-text-muted">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {outcome !== 'DECLINED' && (
              <div>
                <label className="text-xs font-medium text-manager-text-muted">
                  Price they quoted
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="450.00"
                  className="mt-1"
                />
                {/* Said before it's saved, not discovered afterwards. */}
                {over && estimate != null && (
                  <p className="mt-1.5 rounded-md border border-[#e9d8b0] bg-[#faf6ee] px-2.5 py-1.5 text-[11px] text-[#8a6d3b]">
                    {formatPrice(Number(cost))} is over the{' '}
                    {formatPrice(estimate)} the primary approved — they&rsquo;ll
                    be asked again before anything is charged.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-manager-text-muted">
                {outcome === 'DECLINED'
                  ? 'Why not — the guest is shown this'
                  : 'Anything they said worth keeping'}
              </label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  outcome === 'DECLINED'
                    ? 'Fully booked that evening'
                    : 'Ana is away — her brother Luis will take it'
                }
                className="mt-1.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-manager-border bg-white text-manager-text"
              >
                <X className="mr-1.5 size-3.5" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={save}
                disabled={
                  record.isPending ||
                  (outcome === 'ALTERNATIVE' && (!proposedDate || !proposedTime))
                }
                className="bg-manager-accent text-white hover:opacity-90"
              >
                {record.isPending && (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
