'use client';

import { useMemo, useState } from 'react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { HeatMapCellModal } from '@/components/intelligence/pages/heat-maps/HeatMapCellModal';
import { useHeatMap } from '@/hooks/useAnalytics';

const BLOCKS = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];

// white → deep gold by intensity
function cellColor(score: number, max: number): string {
  if (score <= 0) return '#f7f4ef';
  const t = max > 0 ? score / max : 0;
  // interpolate from pale to gold (#c2922d)
  const r = Math.round(247 + (194 - 247) * t);
  const g = Math.round(244 + (146 - 244) * t);
  const b = Math.round(239 + (45 - 239) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export const EstateHeatMapGrid = ({ category }: { category?: string }) => {
  const { data = [], isLoading } = useHeatMap(category);
  const [hover, setHover] = useState<{
    space: string;
    block: string;
    score: number;
  } | null>(null);
  const [drill, setDrill] = useState<{ space: string; timeBlock: string } | null>(
    null,
  );

  const { spaces, lookup, max } = useMemo(() => {
    const spaceSet = new Set<string>();
    const lk = new Map<string, number>();
    let mx = 0;
    for (const e of data) {
      spaceSet.add(e.space);
      lk.set(`${e.space}__${e.timeBlock}`, e.activityScore);
      mx = Math.max(mx, e.activityScore);
    }
    return { spaces: [...spaceSet].sort(), lookup: lk, max: mx };
  }, [data]);

  return (
    <IntelCard className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
          Service Activity — Today
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-intel-text-muted">
          Low
          <span className="flex">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <span
                key={t}
                className="size-3"
                style={{ background: cellColor(t * (max || 1), max || 1) }}
              />
            ))}
          </span>
          High
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : spaces.length === 0 ? (
        <p className="flex h-64 items-center justify-center text-sm text-intel-text-muted">
          No service activity recorded today.
        </p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-32" />
                {BLOCKS.map((b) => (
                  <th
                    key={b}
                    className="px-1 pb-1 text-center text-[10px] font-medium text-intel-text-muted"
                  >
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spaces.map((space) => (
                <tr key={space}>
                  <td className="pr-2 text-right text-xs font-medium text-intel-text">
                    {space}
                  </td>
                  {BLOCKS.map((b) => {
                    const score = lookup.get(`${space}__${b}`) ?? 0;
                    return (
                      <td key={b} className="p-0">
                        <button
                          type="button"
                          onClick={() => setDrill({ space, timeBlock: b })}
                          onMouseEnter={() =>
                            setHover({ space, block: b, score })
                          }
                          onMouseLeave={() => setHover(null)}
                          className="h-9 w-full cursor-pointer rounded-[3px] border border-[#efe9e0] transition-transform hover:scale-105"
                          style={{ background: cellColor(score, max) }}
                          title={`${space} · ${b}: ${score} events`}
                          aria-label={`${space} ${b}, ${score} events — open detail`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {hover ? (
            <div className="mt-3 rounded-md border border-intel-border bg-white px-3 py-2 text-xs shadow-sm">
              <span className="font-medium text-intel-text">{hover.space}</span>
              <span className="text-intel-text-muted">
                {' '}
                · {hover.block} · {hover.score} service event
                {hover.score === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}
        </div>
      )}

      <HeatMapCellModal cell={drill} onClose={() => setDrill(null)} />
    </IntelCard>
  );
};
