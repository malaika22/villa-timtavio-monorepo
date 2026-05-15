import { cn } from '@repo/ui/lib/utils';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import type { VillaOccupancy } from '@/types';

export const VillaOccupancyCard = ({ villa }: { villa: VillaOccupancy }) => (
  <IntelCard className="p-3.5">
    <span className="text-xs font-medium text-intel-text">{villa.name}</span>
    <p className="mt-2 font-cormorant text-[28px] leading-none text-intel-text">
      {villa.occupancy}%
    </p>
    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#ebe6e0]">
      <div
        className={cn(
          'h-full rounded-full',
          villa.status === 'Occupied' ? 'bg-intel-maroon' : 'bg-[#c4bdb6]',
        )}
        style={{ width: `${villa.occupancy}%` }}
      />
    </div>
    <p
      className={cn(
        'mt-2 text-[11px]',
        villa.status === 'Occupied' ? 'text-intel-text-muted' : 'text-intel-text-muted',
      )}
    >
      {villa.status}
    </p>
  </IntelCard>
);
