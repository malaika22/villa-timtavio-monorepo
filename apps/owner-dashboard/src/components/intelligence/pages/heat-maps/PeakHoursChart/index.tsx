'use client';

import { ChartContainer, type ChartConfig } from '@repo/ui/components/chart';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { heatMapPeakHours } from '@/lib/mock-data';
import { usePeakHours } from '@/hooks/useAnalytics';

const chartConfig = {
  index: { label: 'Activity', color: 'var(--intel-maroon)' },
} satisfies ChartConfig;

const AXIS_LABELS = new Set(['6am', '12pm', '6pm', '11pm']);

export const PeakHoursChart = () => {
  const { data } = usePeakHours();
  // Use live hourly activity when present; fall back to sample data. If the day
  // has no events yet every bar is 0, so treat that as "no data" and show the
  // sample shape rather than an empty chart.
  const hasLive = !!data && data.some((d) => d.count > 0);
  const bars = hasLive ? data! : heatMapPeakHours;

  return (
    <IntelCard className="flex h-full min-h-0 flex-col p-4">
      <h3 className="shrink-0 text-sm font-semibold text-intel-text">
        Peak Hours Today
      </h3>
      <p className="mt-0.5 shrink-0 text-xs text-intel-text-muted">
        Activity index by hour
      </p>
      <ChartContainer
        config={chartConfig}
        className="mt-3 min-h-[120px] w-full flex-1"
      >
        <BarChart
          data={bars}
          margin={{ top: 4, right: 2, left: -28, bottom: 0 }}
          barCategoryGap="18%"
        >
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#7A726C', fontSize: 10 }}
            interval={0}
            tickFormatter={(value: string) =>
              AXIS_LABELS.has(value) ? value : ''
            }
          />
          <YAxis hide domain={[0, 100]} />
          <Bar dataKey="index" radius={[2, 2, 0, 0]} maxBarSize={10}>
            {bars.map((entry) => (
              <Cell
                key={entry.hour}
                fill={entry.peak ? '#5e3a31' : '#e5e0da'}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </IntelCard>
  );
};
