'use client';

import { DashboardCard } from '@repo/dashboard-ui';
import { useHeatMap, usePeakHours } from '@/hooks/useAnalytics';

function intensity(score: number, max: number): string {
  if (max <= 0 || score <= 0) return 'bg-[#f3f1ec]';
  const ratio = score / max;
  if (ratio > 0.75) return 'bg-[#3a6448] text-white';
  if (ratio > 0.5) return 'bg-[#4a7c59] text-white';
  if (ratio > 0.25) return 'bg-[#8fb39a]';
  return 'bg-[#d6e4d9]';
}

export const HeatMapsPage = () => {
  const { data: cells, isLoading } = useHeatMap();
  const { data: peak } = usePeakHours();

  const spaces = Array.from(new Set((cells ?? []).map((c) => c.space)));
  const timeBlocks = Array.from(new Set((cells ?? []).map((c) => c.timeBlock)));
  const maxScore = Math.max(1, ...(cells ?? []).map((c) => c.activityScore));
  const scoreFor = (space: string, tb: string) =>
    cells?.find((c) => c.space === space && c.timeBlock === tb)?.activityScore ?? 0;

  const maxPeak = Math.max(1, ...(peak ?? []).map((p) => p.activityIndex));

  return (
    <div className="space-y-5 font-inter">
      <DashboardCard variant="manager" className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-manager-text">
          Estate Activity by Space &amp; Time (today)
        </h3>
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-manager-border" />
        ) : cells && cells.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left text-[10px] uppercase tracking-wide text-manager-text-muted" />
                  {timeBlocks.map((tb) => (
                    <th
                      key={tb}
                      className="px-2 py-1 text-[10px] uppercase tracking-wide text-manager-text-muted"
                    >
                      {tb}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spaces.map((space) => (
                  <tr key={space}>
                    <td className="px-2 py-1 text-xs font-medium text-manager-text">
                      {space}
                    </td>
                    {timeBlocks.map((tb) => {
                      const score = scoreFor(space, tb);
                      return (
                        <td
                          key={tb}
                          className={`rounded-md px-2 py-2.5 text-center text-xs font-medium ${intensity(score, maxScore)}`}
                          title={`${space} · ${tb}: ${score}`}
                        >
                          {score || ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-manager-text-muted">
            No activity recorded today. Heat data appears as service events are
            logged across the estate.
          </p>
        )}
      </DashboardCard>

      <DashboardCard variant="manager" className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-manager-text">
          Peak Hours (today)
        </h3>
        {peak && peak.length > 0 ? (
          <div className="flex h-32 items-end gap-2">
            {peak.map((p) => (
              <div key={p.timeBlock} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-[#c4a882]"
                    style={{ height: `${Math.max(2, (p.activityIndex / maxPeak) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-manager-text-muted">{p.timeBlock}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-manager-text-muted">
            No peak-hour activity recorded today.
          </p>
        )}
      </DashboardCard>
    </div>
  );
};
