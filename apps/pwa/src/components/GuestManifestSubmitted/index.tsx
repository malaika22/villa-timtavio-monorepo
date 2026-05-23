'use client';

import { cn } from '@repo/ui/lib/utils';
import { Check } from 'lucide-react';
import Link from 'next/link';

const MOCK = {
  guestsAdded: 8,
  nextSteps: [
    'Team reviews your guest list and room assignments',
    'Dietary and allergy notes shared with culinary team',
    'Each guest receives a personalised magic link before arrival',
  ],
};

export const GuestManifestSubmitted = () => {
  const { guestsAdded, nextSteps } = MOCK;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-104px)]">
      {/* Scrollable content */}
      <div className="flex-1 flex flex-col items-center gap-6 px-5 pt-12 pb-8">
        {/* Check circle */}
        <div className="flex items-center justify-center size-[72px] rounded-full bg-[#DCE9DC]">
          <Check size={28} strokeWidth={2} className="text-[#3A5E48]" />
        </div>

        {/* Labels + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[2.5px] text-[#9A9288]">
            Guest Manifest
          </p>
          <h1 className="font-cormorant text-[30px] font-medium italic leading-[1.2] text-[#2B2824]">
            Your guest list
            <br />
            has been submitted.
          </h1>
          <p className="text-[13px] font-light leading-relaxed text-[#797168] max-w-[280px]">
            The Casa TimTavio team will review and confirm within 24 hours.
            You&apos;ll be notified once approved.
          </p>
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <StatusChip
            dot="bg-[#3A5E48]"
            chip="border-[#3A5E4847] bg-[#3A5E4818] text-[#3A5E48]"
            label={`${guestsAdded} guests added`}
          />
          <StatusChip
            dot="bg-[#C7A046]"
            chip="border-[#C7A0464D] bg-[#C7A04618] text-[#8B6914]"
            label="Pending review"
          />
        </div>

        {/* What happens next */}
        <div className="w-full rounded-[14px] border border-[#E3E0DA] bg-white px-5 py-4 flex flex-col gap-4">
          <p className="text-[8px] font-semibold uppercase tracking-[2px] text-[#9A9288]">
            What happens next
          </p>
          <ol className="flex flex-col gap-4">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex shrink-0 items-center justify-center size-5 rounded-full border border-[#E3E0DA] bg-[#F5F3EF] text-[9px] font-semibold text-[#797168]">
                  {i + 1}
                </span>
                <p className="text-[13px] leading-snug text-[#2B2824] pt-[1px]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Sticky CTAs */}
      <div className="px-5 pb-8 pt-4 flex flex-col gap-3 bg-timtavio-background">
        <Link
          href="/"
          className={cn(
            'flex items-center justify-center w-full rounded-[12px] bg-[#1A1A18] py-4',
            'text-[10px] font-semibold uppercase tracking-[2.5px] text-white',
            'transition-opacity hover:opacity-90',
          )}
        >
          Back to Home
        </Link>
        <Link
          href="/guest-manifest"
          className={cn(
            'flex items-center justify-center w-full rounded-[12px] border border-[#E3E0DA] bg-white py-4',
            'text-[10px] font-semibold uppercase tracking-[2.5px] text-[#2B2824]',
            'transition-colors hover:bg-[#F5F3F0]',
          )}
        >
          View Guest List
        </Link>
      </div>
    </div>
  );
};

function StatusChip({
  dot,
  chip,
  label,
}: {
  dot: string;
  chip: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
        'text-[10px] font-medium',
        chip,
      )}
    >
      <span className={cn('size-[5px] rounded-full shrink-0', dot)} aria-hidden />
      {label}
    </div>
  );
}
