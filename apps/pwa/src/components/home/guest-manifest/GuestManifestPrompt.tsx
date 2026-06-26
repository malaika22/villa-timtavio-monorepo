'use client';

import { Button } from '@repo/ui/components/button';
import { Progress } from '@repo/ui/components/progress';
import { ArrowRight, Plus, Check, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

type GuestManifestPromptProps = {
  manifestStatus?: string | null;
  guestsAdded?: number;
  maxGuests?: number;
  onAddGuest?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
};

export const GuestManifestPrompt = ({
  manifestStatus,
  guestsAdded = 0,
  maxGuests = 16,
  onAddGuest,
  onSubmit,
  submitting = false,
}: GuestManifestPromptProps) => {
  const pct =
    maxGuests > 0
      ? Math.min(100, Math.round((guestsAdded / maxGuests) * 100))
      : 0;
  const remaining = Math.max(0, maxGuests - guestsAdded);

  // ─── Approved: compact green banner ──────────────────────────────────────
  if (manifestStatus === 'APPROVED') {
    return (
      <Link
        href="/manifest"
        className="flex items-center justify-between gap-3 rounded-[10px] border border-[#3A5E48]/30 bg-[#EAF3E8] px-[14px] py-3.5"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#3A5E48]">
            <Check className="size-4 text-white" strokeWidth={2.5} aria-hidden />
          </span>
          <p className="text-[11px] leading-snug text-[#2F4A3A]">
            <span className="font-semibold">Guest list approved</span> ·{' '}
            {guestsAdded} guest{guestsAdded === 1 ? '' : 's'} · Links sent
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-[#3A5E48]">
          View
          <ArrowRight className="size-3.5 shrink-0" aria-hidden />
        </span>
      </Link>
    );
  }

  // ─── Submitted: awaiting review ──────────────────────────────────────────
  if (manifestStatus === 'SUBMITTED') {
    return (
      <article className="overflow-hidden rounded-[10px] border border-[#E3E0DA] bg-white shadow-[0_1px_2px_rgba(15,31,46,0.04)]">
        <div className="space-y-3 px-[14px] py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-cormorant text-[20px] font-medium italic leading-tight text-[#2B2824]">
              Guest manifest
            </h2>
            <div className="shrink-0 rounded-full border border-[#3A5E48]/30 bg-[#EAF3E8] px-[10px] py-1 text-[10px] font-medium uppercase tracking-[1.12px] text-[#3A5E48]">
              <span className="flex items-center gap-2">
                <Clock className="size-2.5 shrink-0" aria-hidden />
                Submitted
              </span>
            </div>
          </div>
          <p className="text-[11px] leading-[1.45] text-[#797168]">
            Your guest list has been submitted. The estate manager is reviewing
            it — you&apos;ll be notified once it&apos;s approved and links are
            sent.
          </p>
          <div className="flex items-center justify-between border-t border-[#E3E0DA] pt-3">
            <p className="text-[8px] uppercase tracking-[3.08px] text-[#797168]">
              {guestsAdded} of {maxGuests} guests
            </p>
            <Link
              href="/manifest"
              className="flex items-center gap-2 text-[8px] uppercase tracking-[3.08px] text-[#797168]"
            >
              View manifest
              <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // ─── In progress (INCOMPLETE / IN_PROGRESS) ──────────────────────────────
  const isFull = remaining === 0 && guestsAdded > 0;

  return (
    <article className="overflow-hidden rounded-[10px] border border-[#E3E0DA] bg-white shadow-[0_1px_2px_rgba(15,31,46,0.04)]">
      <div className="space-y-4 px-[14px] py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-cormorant text-[20px] font-medium italic leading-tight text-[#2B2824]">
            Guest manifest
          </h2>
          <div
            className="shrink-0 rounded-full border border-[#854F0B]/35 bg-[#FAEEDA] px-[10px] py-1 text-[10px] font-medium uppercase tracking-[1.12px] text-[#854F0B]"
            role="status"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-[5px] shrink-0 rounded-full bg-[#BA7517]"
                aria-hidden
              />
              {isFull ? 'Ready to submit' : 'Action needed'}
            </span>
          </div>
        </div>

        <p className="text-[11px] leading-[1.45] text-[#797168]">
          {isFull
            ? 'All your guests have been added. Submit the list so the estate can review it and send each guest their access link.'
            : 'Assign your guests to rooms and share dietary preferences before arrival.'}
        </p>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-[8px] uppercase tracking-[3.08px] text-[#797168]">
            <span>Guests added</span>
            <span className="font-medium tabular-nums text-[#2B2824]">
              {guestsAdded}
              <span className="text-[#797168]"> / {maxGuests}</span>
            </span>
          </div>
          <Progress value={pct} className="h-1.5 rounded-full bg-[#E3E0DA]" />
        </div>

        <div className="flex items-center justify-between border-t border-[#E3E0DA] pt-4">
          <p className="text-[8px] uppercase tracking-[3.08px] text-[#797168]">
            {remaining} spot{remaining === 1 ? '' : 's'} remaining
          </p>
          <Link
            href="/manifest"
            className="flex items-center gap-2 text-[8px] uppercase tracking-[3.08px] text-[#797168]"
          >
            View Manifest
            <ArrowRight className="size-3.5 shrink-0" aria-hidden />
          </Link>
        </div>

        {isFull ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="h-10 w-full gap-2 rounded-lg border border-[#0F1F2E] bg-[#0F1F2E] text-[12px] font-medium text-white hover:bg-[#1A3040] hover:text-white disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3.5 shrink-0" aria-hidden />
            )}
            {submitting ? 'Submitting…' : 'Submit guest list'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onAddGuest}
            className="h-10 w-full gap-2 rounded-lg border border-[#0F1F2E] bg-[#0F1F2E] text-[12px] font-medium text-white hover:bg-[#1A3040] hover:text-white"
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            Add guests →
          </Button>
        )}
      </div>
    </article>
  );
};
