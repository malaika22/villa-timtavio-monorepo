'use client';

import Link from 'next/link';
import { ArrowRight, BedDouble } from 'lucide-react';

type RoomsExploreCardProps = {
  roomCount?: number;
  previewImage?: string | null;
};

export const RoomsExploreCard = ({
  roomCount,
  previewImage,
}: RoomsExploreCardProps) => {
  return (
    <Link
      href="/rooms"
      className="group block overflow-hidden rounded-[10px] border border-[#E3E0DA] bg-white shadow-[0_1px_2px_rgba(15,31,46,0.04)]"
    >
      {previewImage && (
        <div className="relative h-28 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Villa rooms"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute bottom-2.5 left-3.5">
            <p className="text-[7px] font-semibold uppercase tracking-[2.5px] text-white/70">
              The Villa
            </p>
            <h2 className="font-cormorant text-[19px] italic leading-tight text-white">
              Explore the rooms
            </h2>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-[14px] py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#F0EDE8]">
            <BedDouble className="size-4 text-[#5C534A]" aria-hidden />
          </span>
          <div>
            {!previewImage && (
              <h2 className="font-cormorant text-[16px] italic leading-tight text-[#2B2824]">
                Explore the rooms
              </h2>
            )}
            <p className="text-[10px] leading-snug text-[#797168]">
              {roomCount
                ? `${roomCount} rooms · beds, baths & amenities`
                : 'Beds, baths & amenities'}
            </p>
          </div>
        </div>
        <ArrowRight
          className="size-4 shrink-0 text-[#797168] transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
};
