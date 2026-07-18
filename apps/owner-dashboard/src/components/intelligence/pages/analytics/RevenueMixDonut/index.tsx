'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useRevenueMix } from '@/hooks/useAnalytics';

const COLORS = ['#7b4343', '#c2922d', '#3a5e48', '#8a6d17', '#9a9288'];

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const RevenueMixDonut = () => {
  const { data, isLoading } = useRevenueMix();
  const slices = data?.slices ?? [];
  const total = data?.total ?? 0;
  const topItems = data?.topItems ?? [];

  return (
    <IntelCard className="flex h-full flex-col">
      <h3 className="mb-3 text-center font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Revenue Mix
      </h3>
      {isLoading ? (
        <div className="h-[260px] animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : slices.length === 0 ? (
        <p className="flex h-[260px] items-center justify-center text-sm text-intel-text-muted">
          No settled revenue yet.
        </p>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-[220px] w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((s, i) => (
                    <Cell key={s.key} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as {
                      label: string;
                      value: number;
                    };
                    return (
                      <div className="rounded-md border border-intel-border bg-white px-3 py-2 text-xs shadow-sm">
                        <p className="font-medium text-intel-text">{p.label}</p>
                        <p className="text-intel-text-muted">
                          {money(p.value)}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wide text-intel-text-muted">
                Total
              </span>
              <span className="font-cormorant text-[22px] text-intel-text">
                {money(total)}
              </span>
            </div>
          </div>
          <ul className="w-full space-y-2 sm:w-1/2">
            {slices.map((s, i) => (
              <li
                key={s.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-intel-text">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {s.label}
                </span>
                <span className="tabular-nums text-intel-text-muted">
                  {total ? Math.round((s.value / total) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {topItems.length > 0 ? (
        <div className="mt-4 border-t border-intel-border pt-3">
          <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-intel-text-muted">
            Top line items
          </h4>
          <ul className="space-y-1">
            {topItems.map((it, i) => (
              <li
                key={it.description}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate text-intel-text">
                  <span className="mr-1.5 text-intel-text-muted">{i + 1}.</span>
                  {it.description}
                  {it.count > 1 ? (
                    <span className="text-intel-text-muted"> ×{it.count}</span>
                  ) : null}
                </span>
                <span className="shrink-0 tabular-nums text-intel-text-muted">
                  {money(it.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </IntelCard>
  );
};
