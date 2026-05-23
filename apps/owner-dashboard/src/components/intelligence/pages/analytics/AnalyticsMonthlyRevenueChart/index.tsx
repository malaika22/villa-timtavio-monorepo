'use client';

import { useMemo, useState } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@repo/ui/components/chart';
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';

import { ANALYTICS_CHART } from '@/components/intelligence/pages/analytics/chart-theme';
import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { IntelPillToggle } from '@/components/intelligence/ui/IntelPillToggle';
import { analyticsRevenueByMonth } from '@/lib/mock-data';

const chartConfig = {
  y2026: { label: '2026 Actual', color: ANALYTICS_CHART.revenue2026.stroke },
  y2025: { label: '2025 Actual', color: ANALYTICS_CHART.revenue2025.stroke },
} satisfies ChartConfig;

type MetricView = 'revenue' | 'per-villa' | 'per-night';
type YearView = '2026' | '2025' | 'both';

const LAST_INDEX = analyticsRevenueByMonth.length - 1;

function EndPointDot({
  color,
  cx,
  cy,
  index,
}: {
  color: string;
  cx?: number;
  cy?: number;
  index?: number;
}) {
  if (index !== LAST_INDEX || cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="#fff"
      strokeWidth={1.5}
    />
  );
}

const endPointDot =
  (color: string) => (props: { cx?: number; cy?: number; index?: number }) =>
    EndPointDot({ color, ...props });

export const AnalyticsMonthlyRevenueChart = () => {
  const [metric, setMetric] = useState<MetricView>('revenue');
  const [yearView, setYearView] = useState<YearView>('2026');

  const chartData = useMemo(() => {
    const scale =
      metric === 'per-villa' ? 0.72 : metric === 'per-night' ? 0.38 : 1;
    return analyticsRevenueByMonth.map((row) => ({
      ...row,
      y2026: Math.round(row.y2026 * scale),
      y2025: Math.round(row.y2025 * scale),
    }));
  }, [metric]);

  const show2026 = yearView === '2026' || yearView === 'both';
  const show2025 =
    yearView === '2025' || yearView === 'both' || yearView === '2026';

  return (
    <IntelCard className="flex flex-col rounded-xl p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
            Monthly Revenue — 2026 vs 2025
          </h3>
          <p className="mt-1 text-xs text-intel-text-muted">
            In USD thousands - Projected Q4 based on booking pace
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <IntelPillToggle
            options={[
              { value: 'revenue', label: 'Revenue' },
              { value: 'per-villa', label: 'Per Villa' },
              { value: 'per-night', label: 'Per Night' },
            ]}
            value={metric}
            onChange={setMetric}
          />
          <IntelPillToggle
            options={[
              { value: '2026', label: '2026' },
              { value: '2025', label: '2025' },
              { value: 'both', label: 'Both' },
            ]}
            value={yearView}
            onChange={setYearView}
          />
        </div>
      </div>

      <ChartContainer config={chartConfig} className="mt-3 h-[272px] w-full">
        <ComposedChart
          data={chartData}
          margin={{ top: 28, right: 12, left: 4, bottom: 12 }}
        >
          <defs>
            <linearGradient id="analytics2026Fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={ANALYTICS_CHART.revenue2026.fillTop}
              />
              <stop
                offset="100%"
                stopColor={ANALYTICS_CHART.revenue2026.fillBottom}
              />
            </linearGradient>
            <linearGradient id="analytics2025Fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={ANALYTICS_CHART.revenue2025.fillTop}
              />
              <stop
                offset="100%"
                stopColor={ANALYTICS_CHART.revenue2025.fillBottom}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            stroke={ANALYTICS_CHART.grid}
          />
          <XAxis
            xAxisId="months"
            dataKey="month"
            orientation="top"
            tickLine={false}
            axisLine={false}
            tick={{ fill: ANALYTICS_CHART.tick, fontSize: 11 }}
            dy={-6}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={[0, 52]}
            ticks={[0, 17, 34, 51]}
            tick={{ fill: ANALYTICS_CHART.tick, fontSize: 10 }}
            tickFormatter={() => '0k'}
            width={28}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {show2025 ? (
            <Area
              type="monotone"
              dataKey="y2025"
              xAxisId="months"
              stroke={ANALYTICS_CHART.revenue2025.stroke}
              strokeWidth={1.5}
              fill="url(#analytics2025Fill)"
              fillOpacity={1}
              dot={endPointDot(ANALYTICS_CHART.revenue2025.stroke)}
              activeDot={false}
              isAnimationActive={false}
            />
          ) : null}
          {show2026 ? (
            <Area
              type="monotone"
              dataKey="y2026"
              xAxisId="months"
              stroke={ANALYTICS_CHART.revenue2026.stroke}
              strokeWidth={2}
              fill="url(#analytics2026Fill)"
              fillOpacity={1}
              dot={endPointDot(ANALYTICS_CHART.revenue2026.stroke)}
              activeDot={false}
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>

      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-5 text-[11px] text-intel-text">
          {show2026 ? (
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: ANALYTICS_CHART.revenue2026.stroke }}
              />
              2026 Actual
            </span>
          ) : null}
          {show2025 ? (
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: ANALYTICS_CHART.revenue2025.stroke }}
              />
              2025 Actual
            </span>
          ) : null}
        </div>
        <p className="text-[10px] leading-snug text-intel-text-muted/85">
          Sep–Dec 2026 are projected based on current booking pace
        </p>
      </div>
    </IntelCard>
  );
};
