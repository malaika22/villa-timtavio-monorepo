import Link from 'next/link';
import { Globe, Info } from 'lucide-react';

import type { CurrentBooking } from '@/types';

const Stat = ({ value, label }: { value: string | number; label: string }) => (
  <div className="min-w-[52px] text-center">
    <p className="font-cormorant text-[32px] leading-none text-manager-text">
      {value}
    </p>
    <p className="mt-1 text-[11px] font-medium tracking-[0.14em] text-[#a8a29e] uppercase">
      {label}
    </p>
  </div>
);

export const CurrentBookingHero = ({
  booking,
}: {
  booking: CurrentBooking;
}) => (
  <div className="flex flex-col gap-3">
    <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
      <div className="flex flex-col px-5 py-4 lg:flex-row lg:items-center lg:gap-8 lg:px-6 lg:py-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-manager-accent text-base font-semibold tracking-wide text-white">
            {booking.initials}
          </span>
          <div className="min-w-0">
            <h2 className="font-cormorant text-[26px] leading-tight text-manager-text">
              {booking.guestName}
            </h2>
            <p className="mt-1 text-sm text-[#7a726c]">
              {booking.dates}
              <span className="mx-2 text-[#c4bdb5]">·</span>
              {booking.nights} nights
              <span className="mx-2 text-[#c4bdb5]">·</span>
              {booking.arrivesIn}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {booking.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#ebe6df] px-3 py-1 text-sm font-normal text-[#5e4737]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex shrink-0 flex-wrap items-center gap-6 lg:mt-0 lg:gap-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1.5 text-sm font-medium text-[#1e7e34]">
              <span className="size-2 shrink-0 rounded-full bg-[#1e7e34]" />
              {booking.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f2fd] px-3 py-1.5 text-sm font-medium text-[#1976d2]">
              <Globe className="size-3.5 shrink-0" strokeWidth={2} />
              Lodgify
            </span>
          </div>

          <div className="flex items-center gap-6 border-[#ebe6df] pl-0 lg:border-l lg:pl-6">
            <Stat value={booking.nights} label="Nights" />
            <Stat value={booking.guests} label="Guests" />
            <Stat value={booking.rooms} label="Rooms" />
          </div>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-2 rounded-xl border border-[#e8d4b8] bg-[#fff8f0] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div className="flex items-start gap-2.5 sm:items-center">
        <Info
          className="mt-0.5 size-4 shrink-0 text-[#b45309] sm:mt-0"
          strokeWidth={2}
        />
        <p className="text-sm leading-snug text-[#8b6914]">
          {booking.manifestAlert}
        </p>
      </div>
      <Link
        href="#manifest"
        className="shrink-0 pl-6 text-sm font-medium text-[#8b6914] underline-offset-2 hover:underline sm:pl-0"
      >
        Review now →
      </Link>
    </div>
  </div>
);
