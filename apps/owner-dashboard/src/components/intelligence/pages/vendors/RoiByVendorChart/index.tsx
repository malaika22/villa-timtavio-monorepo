import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { vendorRoiBars } from '@/lib/mock-data';

const BAR_GREEN = '#4a6d55';
const BAR_LOW = '#c4845c';

const maxRoi = Math.max(...vendorRoiBars.map((v) => v.roi));

export const RoiByVendorChart = () => (
  <section className="flex h-full min-h-0 flex-col">
    <h3 className="mb-3 shrink-0 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      ROI by Vendor
    </h3>
    <IntelCard className="flex flex-1 flex-col rounded-xl p-5">
      <ul className="flex flex-1 flex-col justify-center gap-5">
        {vendorRoiBars.map((row) => (
          <li key={row.id}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-sm text-intel-text">{row.label}</span>
              <span
                className="shrink-0 text-sm font-medium tabular-nums"
                style={{ color: row.lowPerformance ? BAR_LOW : BAR_GREEN }}
              >
                {row.roiLabel}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#ebe6df]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.roi / maxRoi) * 100}%`,
                  backgroundColor: row.lowPerformance ? BAR_LOW : BAR_GREEN,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </IntelCard>
  </section>
);
