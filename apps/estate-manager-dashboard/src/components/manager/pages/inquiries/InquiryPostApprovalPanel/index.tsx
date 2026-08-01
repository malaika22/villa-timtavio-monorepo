'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Mail,
  CheckCircle2,
  Paperclip,
  Copy,
} from 'lucide-react';
import { Button, Input } from '@repo/ui';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import {
  useMarkLookbookSent,
  useMarkPaymentLinkSent,
} from '@/hooks/useInquiries';
import {
  buildLookbookMailto,
  buildLookbookMessage,
  LODGIFY_NEW_BOOKING_URL,
} from '@/lib/inquiry-utils';
import type { Inquiry } from '@repo/api-types';

type Props = {
  inquiry: Inquiry;
};

export function InquiryPostApprovalPanel({ inquiry }: Props) {
  const markLookbook = useMarkLookbookSent();
  const markPaymentLink = useMarkPaymentLinkSent();
  const [stripeLink, setStripeLink] = useState(inquiry.stripePaymentLink ?? '');

  function handleOpenLodgify() {
    window.open(LODGIFY_NEW_BOOKING_URL, '_blank', 'noopener,noreferrer');
  }

  // The saved link is what lands in the email — the local input is only a
  // draft until it's been saved against the inquiry.
  const paymentLinkSaved = !!inquiry.stripePaymentLink?.trim();

  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(buildLookbookMessage(inquiry));
      toast.success('Message copied', {
        description: 'Paste it into your mail client.',
      });
    } catch {
      toast.error('Could not copy — select the message manually');
    }
  }

  function handleSendLookbook() {
    window.location.href = buildLookbookMailto(inquiry);

    if (!inquiry.lookbookSentAt) {
      markLookbook.mutate(inquiry.id, {
        onSuccess: () => {
          toast.success('Lookbook email opened', {
            description: 'Marked as sent in the inquiry record.',
          });
        },
      });
    }
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
          onClick={handleSendLookbook}
          // Blocked until the link is saved — the email embeds the SAVED link,
          // so sending early quietly promises a link that never arrives.
          disabled={markLookbook.isPending || !paymentLinkSaved}
          title={
            paymentLinkSaved ? undefined : 'Save the payment link first'
          }
          className="flex-1 border-green-300 bg-white text-manager-text hover:bg-green-50"
        >
          <Mail className="mr-2 size-4" />
          Send lookbook + payment link
        </Button>
      </div>

      {paymentLinkSaved ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
          <Paperclip className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">
              Attach the lookbook PDF
            </strong>{' '}
            in your mail client before sending — a draft opened this way
            can&apos;t carry attachments. The message also links to the online
            lookbook.
            <button
              type="button"
              onClick={handleCopyMessage}
              className="ml-1.5 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
            >
              <Copy className="size-3" aria-hidden />
              Copy message
            </button>
          </span>
        </div>
      ) : (
        <p className="rounded-lg border border-manager-border bg-white px-3 py-2.5 text-xs text-manager-text-muted">
          Save the Stripe payment link below to enable sending — it gets embedded
          in the email.
        </p>
      )}

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
