'use client';

import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

import { useFolio } from '@/hooks/useFolio';
import { mapFolioResponseToMeta } from '@/lib/mappers/folio';

const fmtAmount = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);

// Primary-only entry point to the priced folio. The folio used to live in the
// bottom nav; it moved here to free that slot for the Status tab. Secondary
// guests never see pricing, so this card is rendered for the primary only.
export const FolioSummaryCard = () => {
  const { data: folioData, isLoading } = useFolio();

  if (isLoading || !folioData) return null;

  const meta = mapFolioResponseToMeta(folioData);
  const checkedOut = folioData.booking.status === 'CHECKED_OUT';

  return (
    <Link
      href="/folio"
      className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[#B08D57]/40 bg-[#F5F0E8] p-4 shadow-[0_1px_2px_rgba(15,31,46,0.04)] transition-colors hover:bg-[#EFE8DB]"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#B08D57]/45 bg-white">
        <FileText className="size-5 text-[#8A6D3B]" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-[1.6px] text-[#8A6D3B]">
          Your folio
        </p>
        <h2 className="font-cormorant text-[22px] font-semibold leading-tight text-[#2B2824]">
          {fmtAmount(meta.grandTotal)}
        </h2>
        <p className="mt-0.5 text-[12px] leading-snug text-[#797168]">
          {checkedOut ? 'Payment complete' : 'View charges · auto-charged at checkout'}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[#8A6D3B]" aria-hidden />
    </Link>
  );
};
