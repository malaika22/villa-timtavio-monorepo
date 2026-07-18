'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@repo/ui/components/chart';
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';

import { ANALYTICS_CHART } from '@/components/intelligence/pages/analytics/chart-theme';
import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { BlockSkeleton } from '@/components/intelligence/ui/Skeletons';
import { useOccupancyMonthly } from '@/hooks/useAnalytics';

const chartConfig = {
  y2026: {
    label: '2026 Occupancy',
    color: ANALYTICS_CHART.occupancy2026.stroke,
  },
  y2025: {
    label: '2025 Occupancy',
    color: ANALYTICS_CHART.occupancy2025.stroke,
  },
} satisfies ChartConfig;

const MONTH_TICKS = new Set(['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov', 'Dec']);

export const EstateOccupancyChart = () => {
  const { data: live, isLoading } = useOccupancyMonthly();
  const data = live ?? [];
  if (isLoading) return <BlockSkeleton className="h-full min-h-[280px]" />;
  return (
    <IntelCard className="flex h-full flex-col rounded-xl p-5">
      <div className="shrink-0">
        <h3 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
          Estate Occupancy Rate
        </h3>
        <p className="mt-1 text-xs text-intel-text-muted">
          Monthly · 2026 vs 2025
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="mt-4 min-h-[200px] w-full flex-1"
      >
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="occupancy2026Fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={ANALYTICS_CHART.occupancy2026.fillTop}
              />
              <stop
                offset="100%"
                stopColor={ANALYTICS_CHART.occupancy2026.fillBottom}
              />
            </linearGradient>
            <linearGradient id="occupancy2025Fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={ANALYTICS_CHART.occupancy2025.fillTop}
              />
              <stop
                offset="100%"
                stopColor={ANALYTICS_CHART.occupancy2025.fillBottom}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            stroke={ANALYTICS_CHART.grid}
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: ANALYTICS_CHART.tick, fontSize: 11 }}
            dy={6}
            interval={0}
            tickFormatter={(value: string) =>
              MONTH_TICKS.has(value) ? value : ''
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={[0, 80]}
            ticks={[0, 25, 50, 75]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: ANALYTICS_CHART.tick, fontSize: 10 }}
            width={32}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="y2025"
            stroke={ANALYTICS_CHART.occupancy2025.stroke}
            strokeWidth={1.5}
            fill="url(#occupancy2025Fill)"
            fillOpacity={1}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="y2026"
            stroke={ANALYTICS_CHART.occupancy2026.stroke}
            strokeWidth={2}
            fill="url(#occupancy2026Fill)"
            fillOpacity={1}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>

      <div className="mt-3 flex flex-wrap gap-5 text-[11px] text-intel-text">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: ANALYTICS_CHART.occupancy2026.stroke }}
          />
          2026 Occupancy
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: ANALYTICS_CHART.occupancy2025.stroke }}
          />
          2025 Occupancy
        </span>
      </div>
    </IntelCard>
  );
};
