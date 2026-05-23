import { Check } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { IntelLabel } from '@/components/intelligence/ui/IntelLabel';
import type { BuyRentAnalysisItem } from '@/types';

const BUY = {
  bg: 'bg-[#e8f5ee]',
  border: 'border-[#2d6a4f]/30',
  text: 'text-[#2d6a4f]',
  iconBorder: 'border-[#2d6a4f]',
};

const HOLD = {
  bg: 'bg-[#f5f4f2]',
  border: 'border-[#e8e4de]',
  text: 'text-[#7a726c]',
};

const RENT = {
  bg: 'bg-[#fdf0ec]',
  border: 'border-[#e8c4b8]',
  text: 'text-[#b45309]',
};

const buyActionLine = (lead: string) => lead.replace(/^Recommend:\s*/i, '').trim();

const BuyRecommendationBox = ({ lead, body }: { lead: string; body: string }) => (
  <div
    className={`mt-4 flex flex-1 gap-3 rounded-lg border px-4 py-3.5 ${BUY.bg} ${BUY.border}`}
  >
    <div
      className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${BUY.iconBorder}`}
    >
      <Check className={`size-3.5 ${BUY.text}`} strokeWidth={2.5} />
    </div>
    <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
      <div className={`shrink-0 text-[13px] font-bold leading-snug ${BUY.text}`}>
        <div>Recommend:</div>
        <div>{buyActionLine(lead)}</div>
      </div>
      <p className={`min-w-0 flex-1 text-[12px] font-normal leading-relaxed ${BUY.text}`}>
        {body}
      </p>
    </div>
  </div>
);

const PlainRecommendationBox = ({
  variant,
  children,
}: {
  variant: 'hold' | 'rent';
  children: string;
}) => {
  const s = variant === 'hold' ? HOLD : RENT;
  return (
    <div className={`mt-4 flex-1 rounded-lg border px-4 py-3.5 ${s.bg} ${s.border}`}>
      <p className={`text-[12px] font-normal leading-relaxed ${s.text}`}>{children}</p>
    </div>
  );
};

export const BuyRentDecisionCard = ({ item }: { item: BuyRentAnalysisItem }) => (
  <IntelCard className="flex h-full flex-col rounded-xl p-5">
    <IntelLabel>{item.category}</IntelLabel>
    <p className="mt-2 font-cormorant text-[36px] leading-none tracking-tight text-intel-text">
      {item.decision}
    </p>
    <p className="mt-2 text-sm leading-snug text-intel-text-muted">{item.description}</p>

    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-intel-border py-4">
      {item.metrics.map((m) => (
        <div key={m.label}>
          <p className="text-[10px] leading-snug text-intel-text-muted">{m.label}</p>
          <p className="mt-1 text-sm font-medium tabular-nums text-intel-text">{m.value}</p>
        </div>
      ))}
    </div>

    {item.variant === 'buy' ? (
      <BuyRecommendationBox lead={item.recommendationLead} body={item.recommendationBody} />
    ) : (
      <PlainRecommendationBox variant={item.variant}>
        {`${item.recommendationLead} ${item.recommendationBody}`}
      </PlainRecommendationBox>
    )}
  </IntelCard>
);
