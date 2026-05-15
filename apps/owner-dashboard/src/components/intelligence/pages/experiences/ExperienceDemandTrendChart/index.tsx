'use client';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@repo/ui';
import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { experienceDemandByMonth } from '@/lib/mock-data';

/** Bottom → top draw order for layered fills (Figma 268:1747) */
const SERIES = [
  {
    key: 'yachtCharter' as const,
    label: 'Yacht Charter',
    color: '#2f70af',
    fillId: 'expYachtFill',
    fillTop: 'rgba(47, 112, 175, 0.32)',
    fillBottom: 'rgba(47, 112, 175, 0.04)',
  },
  {
    key: 'spaWellness' as const,
    label: 'Spa & Wellness',
    color: '#4a6d55',
    fillId: 'expSpaFill',
    fillTop: 'rgba(74, 109, 85, 0.28)',
    fillBottom: 'rgba(74, 109, 85, 0.04)',
  },
  {
    key: 'poolExclusive' as const,
    label: 'Pool Exclusive',
    color: '#d47848',
    fillId: 'expPoolFill',
    fillTop: 'rgba(212, 120, 72, 0.3)',
    fillBottom: 'rgba(212, 120, 72, 0.04)',
  },
  {
    key: 'chefsTable' as const,
    label: "Chef's Table",
    color: '#7b4343',
    fillId: 'expChefFill',
    fillTop: 'rgba(123, 67, 67, 0.28)',
    fillBottom: 'rgba(123, 67, 67, 0.03)',
  },
] as const;

const chartConfig = Object.fromEntries(
  SERIES.map((s) => [s.key, { label: s.label, color: s.color }]),
) satisfies ChartConfig;

const LAST_INDEX = experienceDemandByMonth.length - 1;

const endDot =
  (color: string) =>
  (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    if (index !== LAST_INDEX || cx == null || cy == null) return null;
    return (
      <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
    );
  };

/** Figma 268:1747 — layered colorful area fills per experience type */
export const ExperienceDemandTrendChart = () => (
  <IntelCard className="flex flex-col rounded-xl p-5">
    <div>
      <h3 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Experience Demand Trend — Jan to Mar 2026
      </h3>
      <p className="mt-1 text-xs text-intel-text-muted">
        Bookings per month by type · Upward trend in all categories
      </p>
    </div>

    <ChartContainer config={chartConfig} className="mt-4 h-[260px] w-full">
      <ComposedChart
        data={experienceDemandByMonth}
        margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
      >
        <defs>
          {SERIES.map((s) => (
            <linearGradient key={s.fillId} id={s.fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.fillTop} />
              <stop offset="100%" stopColor={s.fillBottom} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E8E4DE" />
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
          domain={[0, 40]}
          ticks={[10, 25, 40]}
          tick={{ fill: '#7A726C', fontSize: 11 }}
          width={28}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {SERIES.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={s.key === 'chefsTable' ? 2 : 1.5}
            fill={`url(#${s.fillId})`}
            fillOpacity={1}
            dot={endDot(s.color)}
            activeDot={false}
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ChartContainer>

    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-intel-text">
      {[...SERIES].reverse().map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  </IntelCard>
);
