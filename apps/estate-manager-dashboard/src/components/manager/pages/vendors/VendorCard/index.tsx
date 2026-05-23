import { Button } from '@repo/ui';

import { VendorStarRating } from '@/components/manager/pages/vendors/VendorStarRating';
import type { VendorProfile } from '@/types';

function formatStatValue(label: string, value: string | number): string | number {
  if (label === 'Avg rating' && typeof value === 'number') {
    return value.toFixed(1);
  }
  return value;
}

const VendorStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="text-center">
    <p className="font-cormorant text-[32px] leading-none text-manager-text">
      {formatStatValue(label, value)}
    </p>
    <p className="font-inter mt-2 text-xs leading-snug text-manager-text-muted">{label}</p>
  </div>
);

export const VendorCard = ({ vendor }: { vendor: VendorProfile }) => (
  <article className="flex flex-col rounded-xl border border-[#e8e4de] bg-white p-5 shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
    <p className="font-inter text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
      {vendor.categoryLabel}
    </p>
    <h3 className="mt-1 font-cormorant text-[22px] font-medium leading-tight text-manager-text">
      {vendor.name}
    </h3>
    <div className="mt-2">
      <VendorStarRating rating={vendor.rating} />
    </div>
    <p className="font-inter mt-2 text-sm text-manager-text-muted">
      Lead: {vendor.lead} · {vendor.location}
    </p>
    <p className="font-inter mt-3 text-sm leading-relaxed text-[#7a726c]">{vendor.description}</p>

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

    <div className="mt-4 flex items-center gap-2">
      <Button className="font-inter h-10 flex-1 rounded-lg border-0 bg-manager-accent text-sm font-medium text-white shadow-none hover:bg-manager-accent-muted">
        Book
      </Button>
      <Button
        variant="ghost"
        className="font-inter h-10 shrink-0 px-4 text-sm font-medium text-manager-text shadow-none hover:bg-transparent hover:text-manager-accent"
      >
        Profile
      </Button>
    </div>
  </article>
);
