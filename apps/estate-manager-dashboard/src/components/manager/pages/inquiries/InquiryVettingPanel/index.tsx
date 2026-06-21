'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@repo/ui';
import { toast } from 'sonner';

import {
  useApproveInquiry,
  useDeclineInquiry,
} from '@/hooks/useInquiries';

type Props = {
  inquiryId: string;
};

export function InquiryVettingPanel({ inquiryId }: Props) {
  const router = useRouter();
  const approveMutation = useApproveInquiry();
  const declineMutation = useDeclineInquiry();

  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  function handleApprove() {
    approveMutation.mutate(
      { id: inquiryId, dto: { notes: notes.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success('Inquiry approved', {
            description:
              'Create the booking in Lodgify, then send the lookbook and payment link.',
          });
        },
      },
    );
  }

  function handleDecline() {
    declineMutation.mutate(
      {
        id: inquiryId,
        dto: { declineReason: declineReason.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success('Inquiry declined', {
            description: 'A polite decline email was sent to the visitor.',
          });
          router.push('/inquiries');
        },
      },
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-manager-border bg-manager-card p-6">
      <div>
        <h2 className="text-sm font-semibold text-manager-text">Decision</h2>
        <p className="mt-1 text-sm text-manager-text-muted">
          Review the visitor profile and message, then approve or decline.
        </p>
      </div>

      {!showDeclineForm ? (
        <>
          <div>
            <label
              htmlFor="approve-notes"
              className="mb-1.5 block text-sm text-manager-text-muted"
            >
              Internal notes (optional)
            </label>
            <textarea
              id="approve-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="e.g. Vetted — Fortune 500 exec, legitimate corporate client"
              className="w-full resize-none rounded-lg border border-manager-border bg-manager-main px-3 py-2 text-sm text-manager-text placeholder:text-manager-text-muted/60 focus:outline-none focus:ring-2 focus:ring-manager-accent/30"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="flex-1 bg-manager-accent text-white hover:opacity-90"
            >
              <CheckCircle className="mr-2 size-4" />
              {approveMutation.isPending ? 'Approving…' : 'Approve inquiry'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeclineForm(true)}
              className="flex-1 border-manager-border text-manager-text hover:bg-manager-main"
            >
              <XCircle className="mr-2 size-4 text-red-500" />
              Decline
            </Button>
          </div>
        </>
      ) : (
        <>
          <div>
            <label
              htmlFor="decline-reason"
              className="mb-1.5 block text-sm text-manager-text-muted"
            >
              Decline reason (internal only)
            </label>
            <textarea
              id="decline-reason"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              rows={3}
              placeholder="e.g. Does not meet property criteria"
              className="w-full resize-none rounded-lg border border-manager-border bg-manager-main px-3 py-2 text-sm text-manager-text placeholder:text-manager-text-muted/60 focus:outline-none focus:ring-2 focus:ring-manager-accent/30"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleDecline}
              disabled={declineMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="mr-2 size-4" />
              {declineMutation.isPending ? 'Declining…' : 'Confirm decline'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeclineForm(false)}
              className="flex-1 border-manager-border text-manager-text"
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {(approveMutation.isError || declineMutation.isError) && (
        <p className="text-sm text-red-500">
          {(approveMutation.error ?? declineMutation.error)?.message ??
            'An error occurred. Please try again.'}
        </p>
      )}
    </div>
  );
}
