import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { revenueByVillaYtd } from '@/lib/mock-data';

const RevenueByVillaCardBody = () => (
  <IntelCard className="flex h-full flex-1 flex-col rounded-xl p-5">
    <ul className="flex flex-1 flex-col justify-center gap-5">
      {revenueByVillaYtd.map((row) => (
        <li key={row.id} className="flex items-center gap-3">
          <span className="w-[5.5rem] shrink-0 text-sm text-intel-text">{row.label}</span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#ebe6df]">
            <div
              className="h-full rounded-full bg-[#6b3e3e]"
              style={{ width: `${row.percent}%` }}
            />
          </div>
          <span className="shrink-0 text-sm tabular-nums text-intel-text-muted">
            {row.amount}
            <span className="text-intel-text-muted/80"> · {row.percent}%</span>
          </span>
        </li>
      ))}
    </ul>

    <div className="mt-6 flex items-center justify-between border-t border-intel-border pt-4">
      <span className="text-sm font-medium text-intel-text">Total YTD</span>
      <span className="font-cormorant text-xl leading-none text-intel-text">$208,000</span>
    </div>
  </IntelCard>
);

export const RevenueByVillaCard = () => (
  <section className="flex h-full min-h-0 flex-col">
    <h3 className="mb-3 shrink-0 text-center font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      Revenue by Villa — YTD 2026
    </h3>
    <RevenueByVillaCardBody />
  </section>
);
