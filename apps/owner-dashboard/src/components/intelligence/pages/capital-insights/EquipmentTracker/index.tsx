'use client';

import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useEquipmentAnalysis } from '@/hooks/useAnalytics';
import type { EquipmentRow } from '@/lib/api/analytics';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

const BADGE: Record<EquipmentRow['recommendation'], string> = {
  BUY: 'bg-[#e8f3ec] text-[#1e7e34]',
  MONITOR: 'bg-[#fdf3e3] text-[#b45309]',
  RENT: 'bg-[#f0eeec] text-[#78716c]',
};

export const EquipmentTracker = () => {
  const { data, isLoading } = useEquipmentAnalysis();
  const [open, setOpen] = useState<string | null>(null);

  const rows = data?.items ?? [];
  const active = rows.find((r) => r.id === open) ?? null;

  return (
    <IntelCard className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
          Equipment — Buy vs Rent
        </h3>
        {data ? (
          <span className="text-xs text-intel-text-muted">
            Projected 2-yr savings:{' '}
            <span className="font-semibold text-[#1e7e34]">
              {money(data.totalProjectedSavings)}
            </span>
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-intel-border text-left text-xs uppercase tracking-wide text-intel-text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Item</th>
                <th className="py-2 px-3 font-medium">Rental/use</th>
                <th className="py-2 px-3 font-medium">Uses/yr</th>
                <th className="py-2 px-3 font-medium">Purchase</th>
                <th className="py-2 px-3 font-medium">Break-even</th>
                <th className="py-2 px-3 font-medium">2-yr savings</th>
                <th className="py-2 px-3 font-medium">Call</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#f1ece4] last:border-0">
                  <td className="py-2 pr-3 font-medium text-intel-text">{r.name}</td>
                  <td className="py-2 px-3 text-intel-text-muted">{money(r.rentalCostPerUse)}</td>
                  <td className="py-2 px-3 text-intel-text-muted">{r.usesPerYear}</td>
                  <td className="py-2 px-3 text-intel-text-muted">{money(r.purchasePrice)}</td>
                  <td className="py-2 px-3 text-intel-text-muted">
                    {r.breakEvenUses != null ? `${r.breakEvenUses} uses` : '—'}
                  </td>
                  <td
                    className={`py-2 px-3 font-medium ${r.twoYearSavings >= 0 ? 'text-[#1e7e34]' : 'text-[#b42318]'}`}
                  >
                    {money(r.twoYearSavings)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE[r.recommendation]}`}>
                      {r.recommendation === 'BUY'
                        ? 'Purchase'
                        : r.recommendation === 'MONITOR'
                          ? 'Monitor'
                          : 'Keep renting'}
                    </span>
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => setOpen(open === r.id ? null : r.id)}
                      className="text-xs font-medium text-intel-maroon hover:underline"
                    >
                      {open === r.id ? 'Hide' : 'Project'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {active ? (
            <div className="mt-4 rounded-lg border border-intel-border bg-[#faf8f4] p-4">
              <p className="mb-1 text-sm font-medium text-intel-text">
                {active.name} · 24-month cost projection
              </p>
              {active.seasonalNotes ? (
                <p className="mb-2 text-xs text-intel-text-muted">
                  {active.seasonalNotes} · maintenance {money(active.annualMaintenance)}/yr
                </p>
              ) : null}
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={active.projection} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--intel-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'months', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <ReferenceLine
                    x={
                      active.annualRental > 0
                        ? Math.round((active.purchasePrice / (active.annualRental / 12)))
                        : undefined
                    }
                    stroke="#1e7e34"
                    strokeDasharray="4 4"
                    label={{ value: 'break-even', fontSize: 10, fill: '#1e7e34' }}
                  />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Line type="monotone" dataKey="rent" name="Keep renting" stroke="#c2922d" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="own" name="Purchase" stroke="#7b4343" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      )}
    </IntelCard>
  );
};
