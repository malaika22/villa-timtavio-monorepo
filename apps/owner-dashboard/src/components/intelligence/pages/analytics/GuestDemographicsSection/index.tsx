import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { IntelLabel } from '@/components/intelligence/ui/IntelLabel';
import {
  bookingSourceBreakdown,
  guestOriginBreakdown,
  guestProfileBreakdown,
} from '@/lib/mock-data';
import type { DemographicRow } from '@/types';

const BAR_PALETTES = {
  source: ['#4a6741', '#5a7a52', '#6a8d63', '#8aa88a'],
  origin: ['#2f70af', '#4a88bf', '#6aa0cf', '#8ab8df', '#aac8e8'],
  profile: ['#c4a882', '#d4b892', '#e4c8a2', '#f0d8b8', '#f8e8d0'],
} as const;

type PaletteKey = keyof typeof BAR_PALETTES;

const DemographicColumn = ({
  title,
  rows,
  palette,
}: {
  title: string;
  rows: DemographicRow[];
  palette: PaletteKey;
}) => {
  const colors = BAR_PALETTES[palette];

  return (
    <IntelCard className="rounded-xl p-5">
      <IntelLabel className="text-intel-text-muted">{title}</IntelLabel>
      <ul className="mt-4 space-y-3.5">
        {rows.map((row, i) => (
          <li key={row.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm text-intel-text">{row.label}</span>
              <span className="text-sm font-medium text-intel-text">{row.percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#f0ebe4]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${row.percent}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </IntelCard>
  );
};

/** Figma 268:1442 — section title outside, column labels inside cards */
export const GuestDemographicsSection = () => (
  <section>
    <h2 className="mb-4 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      Booking Source & Guest Demographics
    </h2>
    <div className="grid gap-5 lg:grid-cols-3">
      <DemographicColumn title="Source" rows={bookingSourceBreakdown} palette="source" />
      <DemographicColumn title="Origin" rows={guestOriginBreakdown} palette="origin" />
      <DemographicColumn title="Profile" rows={guestProfileBreakdown} palette="profile" />
    </div>
  </section>
);
