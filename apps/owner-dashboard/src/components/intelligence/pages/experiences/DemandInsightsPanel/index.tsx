import { cn } from '@repo/ui/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { experienceDemandInsights } from '@/lib/mock-data';
import type { ExperienceInsight } from '@/types';

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

const InsightItem = ({ insight }: { insight: ExperienceInsight }) => {
  const s = styles[insight.variant];
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
        <span className="font-semibold">{insight.title}</span> {insight.message}
      </p>
    </li>
  );
};

export const DemandInsightsPanel = () => (
  <section className="flex h-full min-h-0 flex-col">
    <h3 className="mb-3 shrink-0 text-center font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      Demand Insights
    </h3>
    <IntelCard className="flex flex-1 flex-col rounded-xl p-4">
      <ul className="flex flex-col gap-2.5">
        {experienceDemandInsights.map((insight) => (
          <InsightItem key={insight.id} insight={insight} />
        ))}
      </ul>
    </IntelCard>
  </section>
);
