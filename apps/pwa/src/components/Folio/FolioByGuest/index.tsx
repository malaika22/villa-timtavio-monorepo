'use client';

import { cn } from '@repo/ui/lib/utils';
import { formatPrice } from '@repo/api-types';
import type { FolioGuestSpend } from '@repo/api-types';

/**
 * Spend per party member. The primary is billed for the whole folio, so this is
 * what lets them see what each guest ran up and settle with them independently.
 *
 * Financial only — complimentary experiences never appear here. Charges the
 * estate didn't attribute to anyone (the villa rate, unassigned incidentals)
 * fall to the primary, so these lines add up to the pre-tax subtotal.
 */
export const FolioByGuest = ({
  byGuest,
  className,
}: {
  byGuest: FolioGuestSpend[];
  className?: string;
}) => {
  // Lives on its own folio tab now. It used to sit above the line items, where
  // a party of eight stacked eight cards ahead of the charges themselves.
  if (!byGuest.some((g) => !g.isPrimary)) return null;

  const largest = Math.max(...byGuest.map((g) => g.total));

  return (
    <section className={cn('flex flex-col', className)}>
      <div className="overflow-hidden rounded-[12px]">
        {byGuest.map((guest, i) => (
          <div
            key={guest.email}
            className={cn(
              'flex items-center gap-2.5 border border-[#E3E0DA] bg-white px-3.5 py-2.5',
              i > 0 && '-mt-px',
              i === 0 && 'rounded-t-[12px]',
              i === byGuest.length - 1 && 'rounded-b-[12px]',
              guest.isPrimary && 'border-[#B08D57]/40 bg-[#FBF3DF]',
            )}
          >
            <span
              className={cn(
                'flex size-[22px] shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
                guest.isPrimary
                  ? 'bg-[#B08D57]/[0.18] text-[#8A6D3B]'
                  : 'bg-[#E3E0DA] text-[#797168]',
              )}
              aria-hidden
            >
              {guest.name.charAt(0).toUpperCase()}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate text-[12.5px]',
                  guest.isPrimary ? 'text-[#8A6D3B]' : 'text-[#2B2824]',
                )}
              >
                {guest.isPrimary ? 'You' : guest.name}
              </span>
              <span className="mt-0.5 block text-[9.5px] text-[#9A9288]">
                {guest.itemCount} charge{guest.itemCount === 1 ? '' : 's'}
              </span>
              <span
                className="mt-1 block h-[3px] overflow-hidden rounded-[2px] bg-[#E3E0DA]"
                aria-hidden
              >
                <span
                  className="block h-full rounded-[2px] bg-[#B08D57]"
                  style={{
                    width: `${largest > 0 ? (guest.total / largest) * 100 : 0}%`,
                  }}
                />
              </span>
            </span>

            <span
              className={cn(
                'shrink-0 text-[13px] font-semibold tabular-nums',
                guest.isPrimary ? 'text-[#8A6D3B]' : 'text-[#2B2824]',
              )}
            >
              {formatPrice(guest.total)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] leading-snug text-[#797168]">
        Charges before tax and service. Requests still awaiting a final quote
        aren&apos;t counted yet.
      </p>
    </section>
  );
};
