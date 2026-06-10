'use client';
import { MetricCardGrid } from '@/components/intelligence/cards/MetricCardGrid';
import { VillaOccupancyCard } from '@/components/intelligence/cards/VillaOccupancyCard';
import { RevenueTrendChart } from '@/components/intelligence/charts/RevenueTrendChart';
import { IntelligenceAlerts } from '@/components/intelligence/alerts/IntelligenceAlerts';
import { UpcomingStaysTable } from '@/components/intelligence/tables/UpcomingStaysTable';
import {
  intelligenceAlerts,
  overviewMetrics,
  revenueTrendData,
  upcomingStays,
  villaOccupancy,
} from '@/lib/mock-data';
import { useUpcomingGuests } from '@/hooks/useGuests';

export const OverviewPage = () => {
  const { data: upcomingData, isLoading } = useUpcomingGuests();
  const staysToShow = upcomingData ?? upcomingStays;

  return (
    <div className="space-y-6">
      <MetricCardGrid metrics={overviewMetrics} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-intel-text">
            Villa Occupancy — March 2026
          </h2>
          <a
            href="/analytics"
            className="text-xs text-intel-maroon transition-colors hover:underline"
          >
            Detailed analytics →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {villaOccupancy.map((v) => (
            <VillaOccupancyCard key={v.id} villa={v} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <RevenueTrendChart data={revenueTrendData} />
        <IntelligenceAlerts alerts={intelligenceAlerts} />
      </section>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-[#f0ede8]" />
      ) : (
        <UpcomingStaysTable stays={staysToShow} />
      )}
    </div>
  );
};
