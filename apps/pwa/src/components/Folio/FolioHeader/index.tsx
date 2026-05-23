import { FOLIO_MOCK } from '../mockData';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export const FolioHeader = () => {
  const { breakdown, paymentInfo, totals } = FOLIO_MOCK;
  const currentTotal = totals.subtotal;

  return (
    <div className="bg-[#0F0E0C] px-5 pt-8 pb-6 flex flex-col gap-4">
      {/* Label */}
      <p className="text-[9px] font-semibold uppercase tracking-[2.5px] text-[#5C5A54]">
        Current Total
      </p>

      {/* Big amount */}
      <div className="-mt-1">
        <h1 className="font-cormorant text-[44px] font-medium leading-none text-[#F0EDE6]">
          {fmt(currentTotal)}
        </h1>
        <p className="mt-2 text-[11px] font-light text-[#5C5A54]">
          Villa {fmt(breakdown.villa)} · Experiences {fmt(breakdown.experiences)}{' '}
          · Incidentals {fmt(breakdown.incidentals)}
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Villa" value={fmt(breakdown.villa)} />
        <StatCard label="Experiences" value={fmt(breakdown.experiences)} />
        <StatCard label="Incidentals" value={fmt(breakdown.incidentals)} />
      </div>

      {/* Payment line */}
      <div className="flex items-center gap-2 mt-1">
        <span className="size-[5px] rounded-full bg-[#5C5A54] shrink-0" aria-hidden />
        <p className="text-[10px] font-light text-[#5C5A54]">
          Auto-charged at checkout · {paymentInfo}
        </p>
      </div>
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-[#1A1916] border border-[#2C2B27] flex flex-col items-start px-3 py-3 gap-1">
      <span className="text-[7.5px] font-semibold uppercase tracking-[1.8px] text-[#5C5A54]">
        {label}
      </span>
      <span className="font-cormorant text-[18px] font-medium text-[#D9D5CE] leading-none">
        {value}
      </span>
    </div>
  );
}
