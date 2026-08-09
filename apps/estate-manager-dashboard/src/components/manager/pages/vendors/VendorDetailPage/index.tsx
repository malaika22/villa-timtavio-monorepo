'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Mail, Phone, Star } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

import { useVendorById } from '@/hooks/useVendors';

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-[#e8f1e9] text-[#3a6448]',
  ON_LEAVE: 'bg-[#faf0dc] text-[#8a6d3b]',
  INACTIVE: 'bg-[#f1efea] text-manager-text-muted',
};

/**
 * One vendor, and how they've actually done.
 *
 * The endpoint returned a vendor's whole rating history and no page ever read
 * it — so the ratings the estate is now asked to give had nowhere to be seen,
 * which makes giving them pointless. This is the other half of that loop.
 */
export const VendorDetailPage = ({ id }: { id: string }) => {
  const { data: vendor, isLoading } = useVendorById(id);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-manager-border" />;
  }
  if (!vendor) {
    return (
      <div className="rounded-xl border border-dashed border-manager-border bg-manager-card p-12 text-center">
        <p className="text-sm font-medium text-manager-text">
          We couldn&rsquo;t find that vendor
        </p>
        <Link
          href="/vendors"
          className="mt-3 inline-block text-sm text-manager-accent hover:underline"
        >
          Back to vendors
        </Link>
      </div>
    );
  }

  const ratings = vendor.vendorRatings ?? [];
  const average = vendor.averageRating != null ? Number(vendor.averageRating) : null;

  return (
    <div className="font-inter space-y-5">
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-manager-text-muted hover:text-manager-text"
      >
        <ArrowLeft className="size-3.5" />
        All vendors
      </Link>

      <div className="rounded-xl border border-manager-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-semibold text-manager-text">
                {vendor.name}
              </h1>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  STATUS_TONE[vendor.status] ?? STATUS_TONE.INACTIVE,
                )}
              >
                {vendor.status.replace('_', ' ').toLowerCase()}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-manager-text-muted">
              {vendor.role}
            </p>
            {vendor.bio ? (
              <p className="mt-2 max-w-prose text-sm text-manager-text">
                {vendor.bio}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-lg font-semibold tabular-nums text-manager-text">
              <Star className="size-4 fill-[#c8a96e] text-[#c8a96e]" />
              {average != null ? average.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-manager-text-muted">
              {vendor.totalBookings} booking
              {vendor.totalBookings === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Read by the WhatsApp draft, so a missing number is the reason an
            estate can't ask this vendor anything. */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-manager-border pt-3 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1.5',
              vendor.phone ? 'text-manager-text' : 'text-[#b42318]',
            )}
          >
            <Phone className="size-3.5" />
            {vendor.phone ?? 'No number — WhatsApp bookings won’t work'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-manager-text">
            <Mail className="size-3.5" />
            {vendor.email ?? '—'}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-manager-border bg-white p-5">
        <h2 className="text-sm font-semibold text-manager-text">
          How they&rsquo;ve done
        </h2>

        {ratings.length === 0 ? (
          <p className="mt-2 text-sm text-manager-text-muted">
            No ratings yet. You&rsquo;re asked for one in Approvals each time an
            experience of theirs finishes.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f2efe9]">
            {ratings.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-2.5">
                <span className="flex shrink-0 items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        'size-3.5',
                        n <= r.rating
                          ? 'fill-[#c8a96e] text-[#c8a96e]'
                          : 'text-manager-border',
                      )}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-manager-text">
                    {r.experienceRequest?.catalogItem?.name ?? 'Experience'}
                  </span>
                  {r.notes ? (
                    <span className="mt-0.5 block text-xs italic text-manager-text-muted">
                      “{r.notes}”
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-manager-text-muted">
                  {(() => {
                    try {
                      return format(parseISO(r.createdAt), 'd MMM yyyy');
                    } catch {
                      return '';
                    }
                  })()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
