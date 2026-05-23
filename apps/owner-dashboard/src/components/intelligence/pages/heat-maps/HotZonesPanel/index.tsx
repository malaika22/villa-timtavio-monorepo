import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { heatMapHotZones } from '@/lib/mock-data';

export const HotZonesPanel = () => (
  <IntelCard className="p-4">
    <h3 className="text-sm font-semibold text-intel-text">Hot Zones</h3>
    <ul className="mt-4 space-y-3.5">
      {heatMapHotZones.map((zone) => (
        <li key={zone.id}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-intel-text">{zone.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-intel-text">{zone.score}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#ebe6e0]">
            <div
              className="h-full rounded-full bg-intel-maroon"
              style={{ width: `${zone.score}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  </IntelCard>
);
