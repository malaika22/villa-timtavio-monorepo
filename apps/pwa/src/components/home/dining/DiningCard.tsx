'use client';

import Link from 'next/link';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';

export const DiningCard = () => {
  return (
    <Link
      href="/dining"
      className="group flex items-center justify-between rounded-[10px] border border-[#E3E0DA] bg-white px-[14px] py-3 shadow-[0_1px_2px_rgba(15,31,46,0.04)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#F0EDE8]">
          <UtensilsCrossed className="size-4 text-[#5C534A]" aria-hidden />
        </span>
        <div>
          <h2 className="font-cormorant text-[16px] italic leading-tight text-[#2B2824]">
            Dining
          </h2>
          <p className="text-[10px] leading-snug text-[#797168]">
            Menu, sittings & in-villa orders
          </p>
        </div>
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-[#797168] transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
};
