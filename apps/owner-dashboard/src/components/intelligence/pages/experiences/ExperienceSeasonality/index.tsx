'use client';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useExperienceSeasonality } from '@/hooks/useAnalytics';

function color(v: number, max: number): string {
  if (v <= 0) return '#f4f1eb';
  const t = max > 0 ? v / max : 0;
  const r = Math.round(244 + (194 - 244) * t);
  const g = Math.round(241 + (146 - 241) * t);
  const b = Math.round(235 + (45 - 235) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export const ExperienceSeasonality = () => {
  const { data = [], isLoading } = useExperienceSeasonality();
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <IntelCard className="flex flex-col">
      <h3 className="mb-3 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Experience Demand — 52 Weeks
      </h3>
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : (
        <>
          <div className="flex items-end gap-[2px]">
            {data.map((d) => (
              <div
                key={d.week}
                className="h-12 flex-1 rounded-[2px]"
                style={{ background: color(d.total, max) }}
                title={`Week ${d.week}: ${d.total} requests`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-intel-text-muted">
            <span>52 wks ago</span>
            <span>This week</span>
          </div>
        </>
      )}
    </IntelCard>
  );
};
