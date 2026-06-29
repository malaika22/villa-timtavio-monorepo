'use client';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { PerformanceScatter } from '@/components/intelligence/charts/PerformanceScatter';
import { useVendorPerformance } from '@/hooks/useAnalytics';

export const VendorBookingsRatingScatter = () => {
  const { data, isLoading } = useVendorPerformance();

  const points = (data ?? [])
    .filter((v) => v.bookings > 0 || v.rating > 0)
    .map((v) => ({ name: v.name, x: v.bookings, y: v.rating, z: v.revenue }));

  return (
    <IntelCard className="flex h-full flex-col">
      <h3 className="mb-1 text-center font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Bookings vs Rating
      </h3>
      <p className="mb-3 text-center text-xs text-intel-text-muted">
        Champions (top-right) vs underperformers — bubble size = revenue
      </p>
      {isLoading ? (
        <div className="h-[320px] animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : points.length === 0 ? (
        <p className="flex h-[320px] items-center justify-center text-sm text-intel-text-muted">
          No vendor activity yet.
        </p>
      ) : (
        <PerformanceScatter
          points={points}
          xLabel="Bookings"
          yLabel="Rating"
          yRef={4.5}
        />
      )}
    </IntelCard>
  );
};
