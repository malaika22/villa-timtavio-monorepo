'use client';

import { TrendingUp } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { useVendorForecast } from '@/hooks/useAnalytics';

const REC_COLOR = (rec: string) =>
  rec.startsWith('High')
    ? 'text-[#1e7e34]'
    : rec.startsWith('Steady')
      ? 'text-[#b45309]'
      : 'text-[#9a9288]';

export const VendorDemandForecast = () => {
  const { data, isLoading } = useVendorForecast();
  const rows = (data ?? []).filter((r) => r.last90 > 0).slice(0, 8);

  return (
    <IntelCard className="flex flex-col p-5">
      <h3 className="mb-1 flex items-center gap-1.5 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        <TrendingUp className="size-4 text-[#2f8f6b]" />
        Demand Forecast
      </h3>
      <p className="mb-3 text-xs text-intel-text-muted">
        Projected next-quarter bookings from each vendor&apos;s 90-day run-rate.
      </p>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-[#f0ede8]" />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-intel-text-muted">
          Not enough vendor activity to forecast yet.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-intel-border text-left text-xs uppercase tracking-wide text-intel-text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Vendor</th>
              <th className="py-2 px-3 font-medium">90d</th>
              <th className="py-2 px-3 font-medium">/mo</th>
              <th className="py-2 px-3 font-medium">Next Qtr</th>
              <th className="py-2 pl-3 font-medium">Call</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#f1ece4] last:border-0">
                <td className="py-2 pr-3 font-medium text-intel-text">{r.name}</td>
                <td className="py-2 px-3 text-intel-text-muted">{r.last90}</td>
                <td className="py-2 px-3 text-intel-text-muted">{r.monthlyRate}</td>
                <td className="py-2 px-3 font-medium text-intel-text">
                  ~{r.projectedNextQuarter}
                </td>
                <td className={`py-2 pl-3 text-xs font-medium ${REC_COLOR(r.recommendation)}`}>
                  {r.recommendation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </IntelCard>
  );
};
