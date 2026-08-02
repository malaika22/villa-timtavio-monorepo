'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { formatPrice } from '@repo/api-types';
import type { FolioGuestSpend } from '@repo/api-types';

const TYPE_LABEL: Record<string, string> = {
  ESTATE_BASE_RATE: 'Villa',
  EXPERIENCE: 'Experience',
  INCIDENTAL: 'Incidental',
  PRE_STOCKED: 'Pre-stocked',
};

/**
 * Spend per party member. The primary is billed for the whole folio, so this is
 * what lets them see what each guest ran up and settle with them independently.
 *
 * Each row opens onto the charges behind it. A bare "Sara · $3,600" is a number
 * the primary has to take on trust and can't take up with anyone — the point of
 * this screen is settling up, and you can't settle against a total alone.
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
  // Opens closed: the totals are the summary, the lines are the follow-up.
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  // Lives on its own folio tab now. It used to sit above the line items, where
  // a party of eight stacked eight cards ahead of the charges themselves.
  if (!byGuest.some((g) => !g.isPrimary)) return null;

  const largest = Math.max(...byGuest.map((g) => g.total));

  return (
    <section className={cn('flex flex-col', className)}>
      <div className="overflow-hidden rounded-[12px]">
        {byGuest.map((guest, i) => {
          const isOpen = openEmail === guest.email;
          const items = guest.items ?? [];
          const isLast = i === byGuest.length - 1;

          return (
            <div key={guest.email}>
              <button
                type="button"
                onClick={() =>
                  setOpenEmail(isOpen ? null : guest.email)
                }
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center gap-2.5 border border-[#E3E0DA] bg-white px-3.5 py-2.5 text-left',
                  i > 0 && '-mt-px',
                  i === 0 && 'rounded-t-[12px]',
                  isLast && !isOpen && 'rounded-b-[12px]',
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
                    {' · '}
                    {isOpen ? 'hide' : 'view'}
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

                <ChevronDown
                  className={cn(
                    'size-3.5 shrink-0 text-[#9A9288] transition-transform',
                    isOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>

              {isOpen && (
                <ul
                  className={cn(
                    '-mt-px border border-[#E3E0DA] bg-[#FAF9F7] px-3.5 py-1',
                    isLast && 'rounded-b-[12px]',
                    guest.isPrimary && 'border-[#B08D57]/40',
                  )}
                >
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline gap-2.5 border-b border-[#E3E0DA]/70 py-2 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] text-[#2B2824]">
                          {item.description}
                        </span>
                        <span className="mt-0.5 block text-[9.5px] uppercase tracking-[0.6px] text-[#9A9288]">
                          {TYPE_LABEL[item.type] ?? item.type}
                          {item.quantity > 1 ? ` · ×${item.quantity}` : ''}
                          {item.loggedAt
                            ? ` · ${new Date(item.loggedAt).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' },
                              )}`
                            : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-[#2B2824]">
                        {formatPrice(item.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-snug text-[#797168]">
        Charges before tax and service. Requests still awaiting a final quote
        aren&apos;t counted yet.
      </p>
    </section>
  );
};
