'use client';

import { useState } from 'react';

import { EstateHeatMapGrid } from '@/components/intelligence/pages/heat-maps/EstateHeatMapGrid';
import { HeatMapFilters } from '@/components/intelligence/pages/heat-maps/HeatMapFilters';
import { HeatMapInsights } from '@/components/intelligence/pages/heat-maps/HeatMapInsights';
import { HotZonesPanel } from '@/components/intelligence/pages/heat-maps/HotZonesPanel';
import { PeakHoursChart } from '@/components/intelligence/pages/heat-maps/PeakHoursChart';
import { MockDataBanner } from '@/components/intelligence/ui/MockDataBanner';

export const HeatMapsPage = () => {
  const [category, setCategory] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-4">
      <MockDataBanner message="The estate activity grid is live (today's service events) and the category filter is wired. Side insight panels show sample data." />
      <div className="grid gap-x-5 gap-y-4 xl:grid-cols-[minmax(0,1fr)_272px] xl:items-stretch">
        <div className="min-w-0 xl:col-span-2">
          <HeatMapFilters
            category={category}
            onCategoryChange={setCategory}
          />
        </div>

        <EstateHeatMapGrid category={category} />

        <aside className="grid h-full min-h-[500px] grid-rows-[auto_1fr_auto] gap-4">
          <HotZonesPanel />
          <PeakHoursChart />
          <HeatMapInsights />
        </aside>
      </div>
    </div>
  );
};
