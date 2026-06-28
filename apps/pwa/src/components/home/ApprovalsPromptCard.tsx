'use client';

import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const ApprovalsPromptCard = ({ count }: { count: number }) => {
  if (count <= 0) return null;

  return (
    <Link
      href="/approvals"
      className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[#C7A046]/45 bg-[#FBF3DF] p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)] transition-colors hover:bg-[#F8EDD3]"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#C7A046]/50 bg-white">
        <ShieldCheck className="size-5 text-[#8B6914]" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-cormorant text-[19px] font-semibold leading-tight text-[#2B2824]">
          {count} request{count === 1 ? '' : 's'} need your approval
        </h2>
        <p className="mt-0.5 text-[12px] leading-snug text-[#8B6914]">
          Review paid experiences your party has requested.
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[#8B6914]" aria-hidden />
    </Link>
  );
};
