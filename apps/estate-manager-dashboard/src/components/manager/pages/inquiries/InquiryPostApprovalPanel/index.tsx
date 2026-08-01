'use client';

import { useState } from 'react';
import { ExternalLink, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import {
  useMarkPaymentLinkSent,
  useSendLookbook,
} from '@/hooks/useInquiries';
import { LODGIFY_NEW_BOOKING_URL } from '@/lib/inquiry-utils';
import type { Inquiry } from '@repo/api-types';

type Props = {
  inquiry: Inquiry;
};

export function InquiryPostApprovalPanel({ inquiry }: Props) {
  const sendLookbook = useSendLookbook();
  const markPaymentLink = useMarkPaymentLinkSent();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stripeLink, setStripeLink] = useState(inquiry.stripePaymentLink ?? '');

  function handleOpenLodgify() {
    window.open(LODGIFY_NEW_BOOKING_URL, '_blank', 'noopener,noreferrer');
  }

  // The saved link is what lands in the email — the local input is only a
  // draft until it's been saved against the inquiry.
  const paymentLinkSaved = !!inquiry.stripePaymentLink?.trim();

  // Sends the branded email straight from the app — this is the guest's
  // reservation confirmation, so it goes out once and is not a draft.
  function handleSend() {
    sendLookbook.mutate(inquiry.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success('Reservation email sent', {
          description: `Lookbook and payment link sent to ${inquiry.email}.`,
        });
      },
      onError: (e) => toast.error((e as Error).message),
    });
  }

  function handleLogPaymentLink() {
    if (!stripeLink.trim()) {
      toast.error('Enter the Stripe payment link URL first');
      return;
    }

    markPaymentLink.mutate(
      { id: inquiry.id, dto: { stripePaymentLink: stripeLink.trim() } },
      {
        onSuccess: () => {
          toast.success('Payment link logged');
        },
      },
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-green-200 bg-green-50/60 p-6">
      <div>
        <h2 className="text-sm font-semibold text-green-900">Next steps</h2>
        <p className="mt-1 text-sm text-green-800/80">
          Create the reservation in Lodgify and save the payment link, then send
          the lookbook to the guest. The inquiry will convert automatically when
          the Lodgify webhook syncs.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={handleOpenLodgify}
          className="flex-1 bg-manager-accent text-white hover:opacity-90"
        >
          <ExternalLink className="mr-2 size-4" />
          Create booking in Lodgify →
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmOpen(true)}
          // Blocked until the link is saved — the email embeds the SAVED link,
          // so sending early would confirm a reservation with no way to pay.
          disabled={sendLookbook.isPending || !paymentLinkSaved}
          title={paymentLinkSaved ? undefined : 'Save the payment link first'}
          className="flex-1 border-green-300 bg-white text-manager-text hover:bg-green-50"
        >
          <Mail className="mr-2 size-4" />
          Send lookbook + payment link
        </Button>
      </div>

      {paymentLinkSaved ? (
        <p className="rounded-lg border border-manager-border bg-white px-3 py-2.5 text-xs leading-relaxed text-manager-text-muted">
          Sends the guest their reservation confirmation — stay details, the
          lookbook and the payment link — in the estate&apos;s branded email.
        </p>
      ) : (
        <p className="rounded-lg border border-manager-border bg-white px-3 py-2.5 text-xs text-manager-text-muted">
          Save the Stripe payment link below to enable sending — it gets embedded
          in the email.
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send reservation email?</DialogTitle>
            <DialogDescription>
              This goes to the guest immediately — it is their confirmation, so
              it can&apos;t be recalled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border border-manager-border bg-manager-main px-3 py-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-manager-text-muted">To</span>
              <span className="truncate font-medium text-manager-text">
                {inquiry.email}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-manager-text-muted">Payment link</span>
              <span className="truncate text-manager-text">
                {inquiry.stripePaymentLink}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-manager-accent text-white hover:opacity-90"
              disabled={sendLookbook.isPending}
              onClick={handleSend}
            >
              {sendLookbook.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : null}
              Send now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3 rounded-lg border border-green-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-manager-text-muted">
          Tracking
        </p>
        <div className="flex items-center gap-2 text-sm text-manager-text">
          <CheckCircle2
            className={`size-4 ${inquiry.lookbookSentAt ? 'text-green-600' : 'text-manager-text-muted'}`}
          />
          <span>
            Lookbook{' '}
            {inquiry.lookbookSentAt
              ? `sent ${format(parseISO(inquiry.lookbookSentAt), 'MMM d · h:mm a')}`
              : 'not logged yet'}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={stripeLink}
            onChange={(event) => setStripeLink(event.target.value)}
            placeholder="https://buy.stripe.com/..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleLogPaymentLink}
            disabled={markPaymentLink.isPending}
            className="shrink-0 border-manager-border"
          >
            Log payment link
          </Button>
        </div>
        {inquiry.paymentLinkSentAt ? (
          <p className="text-xs text-manager-text-muted">
            Payment link logged{' '}
            {format(parseISO(inquiry.paymentLinkSentAt), 'MMM d · h:mm a')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
