'use client';

import { ArrowRight, Check, Lock, Users } from 'lucide-react';
import Link from 'next/link';

type GuestManifestPromptProps = {
  manifestStatus?: string | null;
  guestsAdded?: number;
  maxGuests?: number;
  roomsUsed?: number;
  loading?: boolean;
  onAddGuest?: () => void;
  /** @deprecated submission now happens on the manifest screen */
  onSubmit?: () => void;
  submitting?: boolean;
};

type CardState = 'incomplete' | 'in-progress' | 'complete';

export const GuestManifestPrompt = ({
  manifestStatus,
  guestsAdded = 0,
  maxGuests = 16,
  roomsUsed,
  loading = false,
  onAddGuest,
}: GuestManifestPromptProps) => {
  const pct =
    maxGuests > 0
      ? Math.min(100, Math.round((guestsAdded / maxGuests) * 100))
      : 0;

  const isSubmitted =
    manifestStatus === 'SUBMITTED' || manifestStatus === 'APPROVED';
  const isFull = guestsAdded > 0 && guestsAdded >= maxGuests;

  const state: CardState =
    isSubmitted || isFull
      ? 'complete'
      : guestsAdded > 0
        ? 'in-progress'
        : 'incomplete';

  // ─── Loading: skeleton (prevents a flash of the wrong state) ──────────────
  if (loading) {
    return <GuestManifestSkeleton />;
  }

  // ─── Complete ────────────────────────────────────────────────────────────
  if (state === 'complete') {
    const subtext =
      manifestStatus === 'APPROVED'
        ? `Guest list approved · ${guestsAdded} guest${guestsAdded === 1 ? '' : 's'} · links sent`
        : manifestStatus === 'SUBMITTED'
          ? `Submitted for review · ${guestsAdded} guest${guestsAdded === 1 ? '' : 's'}`
          : `Guest list complete · ${guestsAdded} guest${guestsAdded === 1 ? '' : 's'}${
              roomsUsed
                ? ` across ${roomsUsed} room${roomsUsed === 1 ? '' : 's'}`
                : ''
            }`;

    return (
      <article className="animate-manifest-in overflow-hidden rounded-2xl border border-[#CDD6CB] bg-[#EEF1EC] p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)]">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#B7C2B4] bg-[#DCE3D8]">
            <Check
              className="size-5 text-[#3A5E48]"
              strokeWidth={2.5}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-cormorant text-[19px] font-semibold leading-tight text-[#2B2824]">
                Guest Manifest
              </h2>
              <StatusPill tone="green" label="Complete" />
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[#5E6B5C]">
              {subtext}
            </p>
          </div>
        </div>

        <Link
          href="/manifest"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#C9CFBF] bg-white text-[12px] font-semibold uppercase tracking-[2px] text-[#3A5E48] transition-colors hover:bg-[#F6F8F4]"
        >
          View Manifest
          <ArrowRight className="size-3.5 shrink-0" aria-hidden />
        </Link>
      </article>
    );
  }

  // ─── Incomplete ──────────────────────────────────────────────────────────
  if (state === 'incomplete') {
    return (
      <article className="animate-manifest-in overflow-hidden rounded-2xl border border-[#E9E4DC] bg-white p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)]">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#E3D9CD] bg-[#F3EDE4]">
            <Users
              className="size-5 text-[#8C7261]"
              strokeWidth={2}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-cormorant text-[19px] font-semibold leading-tight text-[#2B2824]">
                Guest Manifest
              </h2>
              <StatusPill tone="amber" label="Incomplete" />
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[#797168]">
              Add your guests before arrival so we can prepare rooms,
              preferences, and access links.
            </p>
            {/* Guest-count indicator */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5E5750]">
                {guestsAdded} of {maxGuests} guest
                {maxGuests === 1 ? '' : 's'} added
              </span>
              <span className="text-[11px] font-semibold text-[#8C7261]">
                {pct}%
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFEAE1]"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#8C7261] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddGuest}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F1F2E] text-[12px] font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[#1A3040]"
        >
          Add Guests
          <ArrowRight className="size-3.5 shrink-0" aria-hidden />
        </button>
      </article>
    );
  }

  // ─── In progress ─────────────────────────────────────────────────────────
  return (
    <article className="animate-manifest-in overflow-hidden rounded-2xl border border-[#D9C79A] bg-white p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)]">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#C7A046] bg-[#FBF3DF]">
          <Lock className="size-5 text-[#7A4A42]" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-cormorant text-[19px] font-semibold leading-tight text-[#2B2824]">
              Guest Manifest
            </h2>
            <StatusPill tone="amber" label="In Progress" />
          </div>
          <p className="mt-1 text-[12px] leading-snug text-[#5E5750]">
            {guestsAdded} of {maxGuests} guests added
          </p>
          <div
            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE4D6]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[#8A6D17] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddGuest}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#8A6D17] text-[12px] font-semibold uppercase tracking-[2px] text-white transition-colors hover:bg-[#9C7C1E]"
      >
        Continue
        <ArrowRight className="size-3.5 shrink-0" aria-hidden />
      </button>

      <ViewManifestLink />
    </article>
  );
};

function StatusPill({
  tone,
  label,
}: {
  tone: 'amber' | 'green';
  label: string;
}) {
  const styles =
    tone === 'green'
      ? 'border-[#3A5E48]/30 bg-[#E2EADF] text-[#3A5E48]'
      : 'border-[#C7A046]/45 bg-[#FBF3DF] text-[#8B6914]';
  const dot = tone === 'green' ? 'bg-[#3A5E48]' : 'bg-[#BA8B17]';
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles}`}
      role="status"
    >
      <span
        className={`inline-block size-[5px] shrink-0 rounded-full ${dot}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

function ViewManifestLink() {
  return (
    <div className="mt-3 flex justify-center">
      <Link
        href="/manifest"
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[2px] text-[#797168] transition-colors hover:text-[#2B2824]"
      >
        View Manifest
        <ArrowRight className="size-3 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}

function GuestManifestSkeleton() {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-[#E9E4DC] bg-white p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)]"
      aria-busy="true"
      aria-label="Loading guest manifest"
    >
      <div className="flex items-start gap-3">
        <div className="size-12 shrink-0 animate-pulse rounded-xl bg-[#ECE7DF]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[#ECE7DF]" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-[#ECE7DF]" />
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-[#F0ECE5]" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-[#F0ECE5]" />
        </div>
      </div>
      <div className="mt-4 h-11 w-full animate-pulse rounded-lg bg-[#ECE7DF]" />
    </article>
  );
}
