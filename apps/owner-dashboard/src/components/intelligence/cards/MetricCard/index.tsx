import { cn } from '@repo/ui/lib/utils';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { IntelLabel } from '@/components/intelligence/ui/IntelLabel';
import type { MetricCard as MetricCardType } from '@/types';

export const MetricCard = ({ metric }: { metric: MetricCardType }) => (
  <IntelCard className="p-4">
    <IntelLabel>{metric.label}</IntelLabel>
    <p className="mt-2 font-cormorant text-[34px] leading-none tracking-tight text-intel-text">
      {metric.value}
    </p>
    {metric.trend ? (
      <p
        className={cn(
          'mt-2.5 text-[11px] leading-snug',
          metric.trendDirection === 'up' && 'text-intel-success',
          metric.trendDirection === 'down' && 'text-intel-peach',
          metric.trendDirection === 'neutral' && 'text-intel-text-muted',
          metric.trendDirection === 'warning' && 'text-intel-warning',
          !metric.trendDirection && 'text-intel-success',
        )}
      >
        {metric.trend}
      </p>
    ) : null}
    {metric.subtext ? (
      <p className="mt-2.5 text-[11px] text-intel-text-muted">{metric.subtext}</p>
    ) : null}
  </IntelCard>
);
