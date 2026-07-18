'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import type { VendorStatus } from '@repo/api-types';

import { VendorStarRating } from '@/components/manager/pages/vendors/VendorStarRating';
import { useUpdateVendorStatus } from '@/hooks/useVendors';
import type { VendorProfile } from '@/types';

const STATUS_META: Record<VendorStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-[#e8f3ec] text-[#1e7e34]' },
  ON_LEAVE: { label: 'On leave', cls: 'bg-[#fdf3e2] text-[#b45309]' },
  INACTIVE: { label: 'Inactive', cls: 'bg-[#f0eeec] text-[#78716c]' },
};

const STATUSES: VendorStatus[] = ['ACTIVE', 'ON_LEAVE', 'INACTIVE'];

function formatStatValue(
  label: string,
  value: string | number,
): string | number {
  if (label === 'Avg rating' && typeof value === 'number') {
    return value.toFixed(1);
  }
  return value;
}

const VendorStat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="text-center">
    <p className="font-cormorant text-[32px] leading-none text-manager-text">
      {formatStatValue(label, value)}
    </p>
    <p className="font-inter mt-2 text-xs leading-snug text-manager-text-muted">
      {label}
    </p>
  </div>
);

export const VendorCard = ({ vendor }: { vendor: VendorProfile }) => {
  const updateStatus = useUpdateVendorStatus();
  const status = vendor.status ?? 'ACTIVE';
  const meta = STATUS_META[status];

  return (
    <article className="flex flex-col rounded-xl border border-[#e8e4de] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <p className="font-inter text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
          {vendor.categoryLabel}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
                meta.cls,
              )}
            >
              {meta.label}
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onSelect={(e) => {
                  e.preventDefault();
                  if (s !== status)
                    updateStatus.mutate(
                      { id: vendor.id, status: s },
                      {
                        onSuccess: () => toast.success('Vendor status updated'),
                        onError: (err) => toast.error((err as Error).message),
                      },
                    );
                }}
                className="flex items-center justify-between text-sm"
              >
                {STATUS_META[s].label}
                {s === status ? <Check className="size-3.5" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <h3 className="mt-1 font-cormorant text-[22px] font-medium leading-tight text-manager-text">
        {vendor.name}
      </h3>
      <div className="mt-2">
        <VendorStarRating rating={vendor.rating} />
      </div>
      <p className="font-inter mt-2 text-sm text-manager-text-muted">
        Lead: {vendor.lead} · {vendor.location}
      </p>
      <p className="font-inter mt-3 text-sm leading-relaxed text-[#7a726c]">
        {vendor.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {vendor.serviceTags.map((tag) => (
          <span
            key={tag}
            className="font-inter rounded-full border border-[#e5e0d8] bg-white px-3 py-1 text-sm text-[#5e4737]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#ebe6df] pt-4">
        <VendorStat label="Total bookings" value={vendor.totalBookings} />
        <VendorStat label="Avg rating" value={vendor.avgRating} />
        <VendorStat label="Avg booking" value={vendor.avgBooking} />
      </div>
    </article>
  );
};
