import { BuyRentDecisionCard } from '@/components/intelligence/pages/capital-insights/BuyRentDecisionCard';
import { buyRentAnalysisItems } from '@/lib/mock-data';

/** Figma 268:2300 — 3×2 Buy vs. Rent grid */
export const BuyRentAnalysisSection = () => (
  <section>
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <h2 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Buy vs. Rent Analysis
      </h2>
      <p className="text-xs text-intel-text-muted sm:text-right">
        Based on Q1 2026 utilization + projected annual demand
      </p>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {buyRentAnalysisItems.map((item) => (
        <BuyRentDecisionCard key={item.id} item={item} />
      ))}
    </div>
  </section>
);
