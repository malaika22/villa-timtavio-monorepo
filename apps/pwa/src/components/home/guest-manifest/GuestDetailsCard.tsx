'use client';

import { ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';

type GuestDetailsCardProps = {
  guestsAdded?: number;
  roomsUsed?: number;
};

export const GuestDetailsCard = ({
  guestsAdded = 0,
  roomsUsed,
}: GuestDetailsCardProps) => {
  const subtext =
    guestsAdded > 0
      ? `${guestsAdded} guest${guestsAdded === 1 ? '' : 's'}${
          roomsUsed ? ` across ${roomsUsed} room${roomsUsed === 1 ? '' : 's'}` : ''
        }`
      : 'View who is staying and what they have planned';

  return (
    <Link
      href="/manifest"
      className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[#E3E0DA] bg-white p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)] transition-colors hover:bg-[#FAF9F7]"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#D8D3C9] bg-[#F3F1EC]">
        <Users className="size-5 text-[#5E5750]" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-cormorant text-[19px] font-semibold leading-tight text-[#2B2824]">
          Guest details
        </h2>
        <p className="mt-0.5 text-[12px] leading-snug text-[#797168]">
          {subtext}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[#797168]" aria-hidden />
    </Link>
  );
};
