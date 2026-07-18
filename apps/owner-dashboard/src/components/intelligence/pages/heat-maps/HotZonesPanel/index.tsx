'use client';

import { useMemo } from 'react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useHeatMap } from '@/hooks/useAnalytics';

type Zone = { id: string; label: string; score: number };

export const HotZonesPanel = ({ category }: { category?: string }) => {
  const { data, isLoading } = useHeatMap(category);

  // Busiest spaces = sum of activity across all time blocks, normalised to the
  // hottest space (0–100), top 6.
  const zones = useMemo<Zone[]>(() => {
    if (!data || data.length === 0) return [];
    const bySpace = new Map<string, number>();
    for (const cell of data) {
      bySpace.set(
        cell.space,
        (bySpace.get(cell.space) ?? 0) + cell.activityScore,
      );
    }
    const ranked = [...bySpace.entries()].sort((a, b) => b[1] - a[1]);
    const max = ranked[0]?.[1] ?? 0;
    if (max === 0) return [];
    return ranked.slice(0, 6).map(([space, total]) => ({
      id: space,
      label: space,
      score: Math.round((total / max) * 100),
    }));
  }, [data]);

  return (
    <IntelCard className="p-4">
      <h3 className="text-sm font-semibold text-intel-text">Hot Zones</h3>
      {isLoading ? (
        <div className="mt-4 space-y-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-[#f0ede8]" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <p className="mt-4 text-xs text-intel-text-muted">No activity yet.</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
        {zones.map((zone) => (
          <li key={zone.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-intel-text">{zone.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-intel-text">
                {zone.score}
              </span>
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
      )}
    </IntelCard>
  );
};
