import { cn } from '@repo/ui/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { vendorStrategicRecommendations } from '@/lib/mock-data';
import type { VendorRecommendation } from '@/types';

const styles = {
  warning: {
    bg: 'bg-intel-warning-bg',
    text: 'text-intel-warning',
    icon: AlertCircle,
  },
  success: {
    bg: 'bg-intel-success-bg',
    text: 'text-intel-success',
    icon: CheckCircle2,
  },
  info: {
    bg: 'bg-intel-info-bg',
    text: 'text-intel-info',
    icon: Info,
  },
} as const;

const RecommendationItem = ({ item }: { item: VendorRecommendation }) => {
  const s = styles[item.variant];
  const Icon = s.icon;

  return (
    <li
      className={cn(
        'flex gap-2.5 rounded-md px-3 py-3 text-[11px] leading-relaxed',
        s.bg,
        s.text,
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
      <p>
        <span className="font-semibold">{item.title}</span> {item.message}
      </p>
    </li>
  );
};

/** Figma 268:2010 — Strategic Recommendations */
export const StrategicRecommendationsPanel = () => (
  <section className="flex h-full min-h-0 flex-col">
    <h3 className="mb-3 shrink-0 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      Strategic Recommendations
    </h3>
    <IntelCard className="flex flex-1 flex-col rounded-xl p-4">
      <ul className="flex flex-col gap-2.5">
        {vendorStrategicRecommendations.map((item) => (
          <RecommendationItem key={item.id} item={item} />
        ))}
      </ul>
    </IntelCard>
  </section>
);
