'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@repo/ui';

import { InquiryConvertedPanel } from '@/components/manager/pages/inquiries/InquiryConvertedPanel';
import { InquiryDeleteButton } from '@/components/manager/pages/inquiries/InquiryDeleteButton';
import { InquiryPostApprovalPanel } from '@/components/manager/pages/inquiries/InquiryPostApprovalPanel';
import { InquiryVettingPanel } from '@/components/manager/pages/inquiries/InquiryVettingPanel';
import { useInquiry } from '@/hooks/useInquiries';
import { toSocialUrl, socialLinkLabel } from '@/lib/inquiry-utils';
import { PURPOSE_LABEL, STATUS_PILL } from '../InquiriesPage/constants';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
}

/**
 * Website inquiries pack extra fields the API has no column for into `message`
 * as "Label: Value · Label: Value". Parse that back into structured pairs so we
 * can render them cleanly; returns null for free-form messages (render as prose).
 */
function parseStructuredMessage(
  message: string,
): { label: string; value: string }[] | null {
  const segments = message
    .split(/\s·\s|\s\|\s/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length < 2) return null;

  const fields = segments.map((seg) => {
    const idx = seg.indexOf(':');
    if (idx === -1) return null;
    const label = seg.slice(0, idx).trim();
    const value = seg.slice(idx + 1).trim();
    return label && value ? { label, value } : null;
  });

  return fields.every((f): f is { label: string; value: string } => f !== null)
    ? fields
    : null;
}

function DetailRow({
  label,
  value,
  href,
  linkLabel = 'View',
}: {
  label: string;
  value?: string | null;
  href?: string | null;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-manager-text-muted">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-right text-sm font-medium text-manager-accent hover:underline"
        >
          {linkLabel} →
          <ExternalLink className="size-3.5" />
        </a>
      ) : (
        <span className="text-right text-sm font-medium text-manager-text">
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}

export function InquiryDetailPage({ id }: { id: string }) {
  const { data: inquiry, isLoading } = useInquiry(id);

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
  const socialUrl = toSocialUrl(inquiry.socialHandle);
  const messageFields = inquiry.message
    ? parseStructuredMessage(inquiry.message)
    : null;
  const isPending = inquiry.status === 'NEW';
  const isApproved = inquiry.status === 'APPROVED';
  const isConverted = inquiry.status === 'CONVERTED';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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

      <div className="rounded-xl border border-manager-border bg-manager-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-cormorant text-2xl text-manager-text">
              {inquiry.firstName} {inquiry.lastName}
            </h1>
            <p className="mt-0.5 text-sm text-manager-text-muted">
              {inquiry.email}
            </p>
            {inquiry.phone ? (
              <p className="text-sm text-manager-text-muted">{inquiry.phone}</p>
            ) : null}
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
          <DetailRow
            label="Social profile"
            value={inquiry.socialHandle}
            href={socialUrl}
            linkLabel={socialLinkLabel(socialUrl)}
          />
          <DetailRow label="Received" value={formatDate(inquiry.createdAt)} />
        </div>

        {inquiry.message ? (
          <div className="mt-4 rounded-lg bg-manager-main p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-manager-text-muted">
              {messageFields ? 'Additional details' : 'Message'}
            </p>
            {messageFields ? (
              <dl className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {messageFields.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-baseline justify-between gap-3 border-b border-manager-border/70 py-2 last:border-0"
                  >
                    <dt className="text-xs uppercase tracking-wide text-manager-text-muted">
                      {f.label}
                    </dt>
                    <dd className="text-right text-sm font-medium text-manager-text">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-manager-text">
                {inquiry.message}
              </p>
            )}
          </div>
        ) : null}

        {inquiry.status === 'DECLINED' && inquiry.declineReason ? (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-red-500">
              Internal decline reason
            </p>
            <p className="mt-1 text-sm text-red-700">{inquiry.declineReason}</p>
          </div>
        ) : null}

        {inquiry.notes ? (
          <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-600">
              Review notes
            </p>
            <p className="mt-1 text-sm text-green-800">{inquiry.notes}</p>
          </div>
        ) : null}
      </div>

      {isPending ? <InquiryVettingPanel inquiryId={inquiry.id} /> : null}
      {/* Stays visible after conversion. Creating the Lodgify booking is what
          flips the inquiry to CONVERTED, so hiding this on conversion removed
          the send button at exactly the point Rodrigo needed it. */}
      {isApproved || isConverted ? (
        <InquiryPostApprovalPanel inquiry={inquiry} />
      ) : null}
      {isConverted ? <InquiryConvertedPanel inquiry={inquiry} /> : null}

      <InquiryDeleteButton
        inquiryId={inquiry.id}
        guestName={`${inquiry.firstName} ${inquiry.lastName}`}
        guestEmail={inquiry.email}
        status={inquiry.status}
        redirectOnSuccess
      />
    </div>
  );
}
