'use client';

import Link from 'next/link';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';

import { useMenu } from '@/hooks/useDining';

/**
 * Dining, on the home screen.
 *
 * It was a single 44px row between two taller cards, and the estate manager
 * read it as a link to a document rather than something a guest is meant to
 * act on — which it is: the kitchen needs the party's choices before it can
 * shop for them.
 *
 * So it takes the same shape as the rooms card beside it: a photograph from
 * the estate's own menu, the invitation over it, and the detail underneath.
 * A dish the kitchen actually serves does more to start this than any stock
 * scene would.
 */
export const DiningCard = () => {
  const { data: menu } = useMenu();

  // The first dish the estate has photographed. Ordinary menus have none for
  // months, so the card has to be worth looking at without one.
  const preview = (menu ?? []).find(
    (item) => item.isActive && item.photoUrl?.trim(),
  )?.photoUrl;

  return (
    <Link
      href="/dining"
      className="group block overflow-hidden rounded-[10px] border border-[#E3E0DA] bg-white shadow-[0_1px_2px_rgba(15,31,46,0.04)]"
    >
      {preview ? (
        <div className="relative h-28 w-full overflow-hidden">
          {/* External CDN image — deliberately a plain <img>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2.5 left-3.5">
            <p className="text-[7px] font-semibold uppercase tracking-[2.5px] text-white/70">
              The Table
            </p>
            <h2 className="font-cormorant text-[19px] italic leading-tight text-white">
              Choose your meals
            </h2>
          </div>
        </div>
      ) : (
        /* No photograph yet — the invitation still has to carry, so it gets
           the height on its own rather than collapsing back to a row. */
        <div className="relative flex h-24 w-full flex-col justify-end overflow-hidden bg-gradient-to-br from-[#EFE9DF] to-[#E2DACC] px-3.5 pb-2.5">
          <UtensilsCrossed
            className="absolute -right-3 -top-2 size-24 text-[#0F1F2E]/[0.05]"
            strokeWidth={1}
            aria-hidden
          />
          <p className="text-[7px] font-semibold uppercase tracking-[2.5px] text-[#9A9082]">
            The Table
          </p>
          <h2 className="font-cormorant text-[19px] italic leading-tight text-[#2B2824]">
            Choose your meals
          </h2>
        </div>
      )}

      <div className="flex items-center justify-between px-[14px] py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#F0EDE8]">
            <UtensilsCrossed className="size-4 text-[#5C534A]" aria-hidden />
          </span>
          <p className="text-[10px] leading-snug text-[#797168]">
            Menu, sittings &amp; in-villa orders
          </p>
        </div>
        <ArrowRight
          className="size-4 shrink-0 text-[#797168] transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
};
