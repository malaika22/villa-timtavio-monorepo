'use client';

import { BuyRentDecisionCard } from '@/components/intelligence/pages/capital-insights/BuyRentDecisionCard';
import { BlockSkeleton } from '@/components/intelligence/ui/Skeletons';
import { useEquipmentAnalysis } from '@/hooks/useAnalytics';
import type { EquipmentRow } from '@/lib/api/analytics';
import type {
  BuyRentAnalysisItem,
  BuyRentRecommendationVariant,
  CapitalDecision,
} from '@/types';

const money = (n: number) => {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
};

const paybackYears = (row: EquipmentRow) =>
  row.breakEvenUses && row.usesPerYear > 0
    ? row.breakEvenUses / row.usesPerYear
    : null;

// Map a live equipment row to the decision-card shape. Same data the Equipment
// Tracker shows, presented as a buy/rent verdict.
function toDecisionItem(row: EquipmentRow): BuyRentAnalysisItem {
  const payback = paybackYears(row);
  const paybackLabel = payback !== null ? `${payback.toFixed(1)} yrs` : '—';
  const uses = row.usesPerYear;

  const decision: CapitalDecision =
    row.recommendation === 'BUY'
      ? 'BUY'
      : row.recommendation === 'RENT'
        ? 'RENT'
        : 'HOLD';
  const variant: BuyRentRecommendationVariant =
    row.recommendation === 'BUY'
      ? 'buy'
      : row.recommendation === 'RENT'
        ? 'rent'
        : 'hold';

  let lead: string;
  let body: string;
  if (row.recommendation === 'BUY') {
    lead = 'Recommend: Purchase.';
    body = `At ~${uses} uses/yr, ownership pays back in ${paybackLabel} and saves ~${money(
      row.twoYearSavings,
    )} over 24 months vs. renting.`;
  } else if (row.recommendation === 'RENT') {
    lead = 'Continue renting.';
    body = `At ~${uses} uses/yr, leasing (~${money(
      row.annualRental,
    )}/yr) stays cheaper than owning.${
      row.seasonalNotes ? ` ${row.seasonalNotes}` : ''
    }`;
  } else {
    lead = 'Monitor.';
    body = `Usage (~${uses}/yr) sits near break-even. Revisit if demand rises; renting remains competitive for now.${
      row.seasonalNotes ? ` ${row.seasonalNotes}` : ''
    }`;
  }

  return {
    id: row.id,
    category: row.category.toUpperCase(),
    decision,
    description: row.name,
    metrics: [
      { label: 'Current annual cost', value: money(row.annualRental) },
      { label: 'Purchase cost', value: money(row.purchasePrice) },
      { label: 'Payback period', value: paybackLabel },
    ],
    recommendationLead: lead,
    recommendationBody: body,
    variant,
  };
}

export const BuyRentAnalysisSection = () => {
  const { data, isLoading } = useEquipmentAnalysis();
  const items: BuyRentAnalysisItem[] = data?.items.map(toDecisionItem) ?? [];

  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
          Buy vs. Rent Analysis
        </h2>
        <p className="text-xs text-intel-text-muted sm:text-right">
          Based on tracked utilization + projected annual demand
        </p>
      </div>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <BlockSkeleton key={i} className="h-48" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-intel-text-muted">
          No tracked equipment yet — add assets to see buy-vs-rent guidance.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <BuyRentDecisionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
};
