'use client';

import { useRef, useState } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@repo/ui/components/chart';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@repo/ui/lib/utils';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { ExportMenu } from '@/components/intelligence/ui/ExportMenu';
import type { RevenueMonth } from '@/types';

const chartConfig = {
  y2026: { label: '2026', color: 'var(--intel-maroon)' },
  y2025: { label: '2025', color: 'var(--intel-gold)' },
} satisfies ChartConfig;

export const RevenueTrendChart = ({ data }: { data: RevenueMonth[] }) => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const chartRef = useRef<HTMLDivElement>(null);
  const chartData =
    period === 'monthly'
      ? data
      : [
          { month: 'Q1', y2026: 155, y2025: 136 },
          { month: 'Q2', y2026: 222, y2025: 189 },
          { month: 'Q3', y2026: 361, y2025: 293 },
          { month: 'Q4', y2026: 194, y2025: 170 },
        ];

  return (
    <IntelCard className="flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-intel-text">
            Revenue Trend — 2026 vs 2025
          </h3>
          <p className="mt-0.5 text-xs text-intel-text-muted">
            Monthly revenue in USD thousands
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-intel-border bg-intel-main p-0.5">
            {(['monthly', 'quarterly'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded px-3 py-1 text-xs capitalize transition-colors',
                  period === p
                    ? 'bg-intel-maroon text-white'
                    : 'text-intel-text-muted hover:text-intel-text',
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <ExportMenu
            filename="revenue-trend"
            csvRows={chartData as unknown as Record<string, unknown>[]}
            pngTarget={chartRef}
          />
        </div>
      </div>
      <div ref={chartRef}>
        <ChartContainer config={chartConfig} className="mt-4 h-[240px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenue2026Fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--intel-maroon)"
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor="var(--intel-maroon)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E8E4DE"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#7A726C', fontSize: 11 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[30, 150]}
              ticks={[30, 60, 90, 120, 150]}
              tick={{ fill: '#7A726C', fontSize: 11 }}
              tickFormatter={(v) => `${v}k`}
              width={36}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="y2026"
              stroke="none"
              fill="url(#revenue2026Fill)"
            />
            <Line
              type="monotone"
              dataKey="y2026"
              stroke="var(--intel-maroon)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="y2025"
              stroke="var(--intel-gold)"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
      <div className="mt-2 flex gap-5 text-xs text-intel-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-intel-maroon" />
          2026
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-intel-gold" />
          2025
        </span>
      </div>
    </IntelCard>
  );
};
