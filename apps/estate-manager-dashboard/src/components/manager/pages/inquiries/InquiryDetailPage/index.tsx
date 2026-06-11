'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@repo/ui';
import {
  useInquiry,
  useApproveInquiry,
  useDeclineInquiry,
} from '@/hooks/useInquiries';
import type { InquiryStatus } from '@repo/api-types';

const PURPOSE_LABEL: Record<string, string> = {
  CORPORATE_RETREAT: 'Corporate Retreat',
  FAMILY: 'Family',
  WEDDING: 'Wedding',
  CONTENT_PRODUCTION: 'Content Production',
  OTHER: 'Other',
};

const STATUS_PILL: Record<InquiryStatus, { label: string; classes: string }> = {
  NEW: {
    label: 'New',
    classes: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  APPROVED: {
    label: 'Approved',
    classes: 'bg-green-50 text-green-700 border border-green-200',
  },
  DECLINED: {
    label: 'Declined',
    classes: 'bg-red-50 text-red-600 border border-red-200',
  },
  CONVERTED: {
    label: 'Converted',
    classes: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-manager-text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-manager-text">
        {value ?? '—'}
      </span>
    </div>
  );
}

export function InquiryDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: inquiry, isLoading } = useInquiry(id);

  const approveMutation = useApproveInquiry();
  const declineMutation = useDeclineInquiry();

  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const isActioned =
    inquiry?.status === 'APPROVED' ||
    inquiry?.status === 'DECLINED' ||
    inquiry?.status === 'CONVERTED';

  function handleApprove() {
    approveMutation.mutate(
      { id, dto: { notes: notes.trim() || undefined } },
      { onSuccess: () => router.push('/inquiries') },
    );
  }

  function handleDecline() {
    declineMutation.mutate(
      { id, dto: { declineReason: declineReason.trim() || undefined } },
      { onSuccess: () => router.push('/inquiries') },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-manager-border" />
        <div className="h-64 animate-pulse rounded-xl bg-manager-border" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="rounded-xl border border-manager-border bg-manager-card p-8 text-center">
        <p className="text-sm text-manager-text-muted">Inquiry not found.</p>
        <Link
          href="/inquiries"
          className="mt-3 inline-block text-sm text-manager-accent underline"
        >
          Back to inquiries
        </Link>
      </div>
    );
  }

  const pill = STATUS_PILL[inquiry.status];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 text-manager-text-muted hover:text-manager-text"
        >
          <Link href="/inquiries">
            <ArrowLeft className="mr-1 size-4" />
            Inquiries
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-manager-border bg-manager-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-cormorant text-2xl text-manager-text">
              {inquiry.firstName} {inquiry.lastName}
            </h1>
            <p className="mt-0.5 text-sm text-manager-text-muted">
              {inquiry.email}
            </p>
            {inquiry.phone && (
              <p className="text-sm text-manager-text-muted">{inquiry.phone}</p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${pill.classes}`}
          >
            {pill.label}
          </span>
        </div>

        <div className="mt-4 divide-y divide-manager-border">
          <DetailRow
            label="Preferred Dates"
            value={
              inquiry.preferredFrom
                ? `${formatDate(inquiry.preferredFrom)} – ${formatDate(inquiry.preferredTo)}`
                : undefined
            }
          />
          <DetailRow
            label="Guests"
            value={inquiry.guestCount ? String(inquiry.guestCount) : undefined}
          />
          <DetailRow
            label="Purpose of Stay"
            value={
              inquiry.purposeOfStay
                ? (PURPOSE_LABEL[inquiry.purposeOfStay] ??
                  inquiry.purposeOfStay)
                : undefined
            }
          />
          <DetailRow label="Source" value={inquiry.source} />
          <DetailRow label="Social Handle" value={inquiry.socialHandle} />
          <DetailRow label="Received" value={formatDate(inquiry.createdAt)} />
        </div>

        {inquiry.message && (
          <div className="mt-4 rounded-lg bg-manager-main p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-manager-text-muted">
              Message
            </p>
            <p className="mt-2 text-sm leading-relaxed text-manager-text">
              {inquiry.message}
            </p>
          </div>
        )}

        {inquiry.status === 'DECLINED' && inquiry.declineReason && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-red-500">
              Decline Reason
            </p>
            <p className="mt-1 text-sm text-red-700">{inquiry.declineReason}</p>
          </div>
        )}

        {inquiry.status === 'APPROVED' && inquiry.notes && (
          <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-600">
              Review Notes
            </p>
            <p className="mt-1 text-sm text-green-800">{inquiry.notes}</p>
          </div>
        )}
      </div>

      {!isActioned && (
        <div className="rounded-xl border border-manager-border bg-manager-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-manager-text">Decision</h2>

          {!showDeclineForm ? (
            <>
              <div>
                <label
                  htmlFor="approve-notes"
                  className="block text-sm text-manager-text-muted mb-1.5"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="approve-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  className="block text-sm text-manager-text-muted mb-1.5"
                >
                  Decline reason (optional)
                </label>
                <textarea
                  id="decline-reason"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
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
      )}
    </div>
  );
}
