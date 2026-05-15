import { cn } from '@repo/ui/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { heatMapInsights } from '@/lib/mock-data';

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
};

export const HeatMapInsights = () => (
  <IntelCard className="p-4">
    <h3 className="text-sm font-semibold text-intel-text">Insights</h3>
    <ul className="mt-3 space-y-2">
      {heatMapInsights.map((item) => {
        const s = styles[item.variant];
        const Icon = s.icon;
        return (
          <li
            key={item.id}
            className={cn(
              'flex gap-2 rounded-md border px-2.5 py-2 text-[11px] leading-snug',
              s.bg,
              s.text,
              item.variant === 'warning' ? 'border-intel-warning/25' : 'border-intel-success/25',
            )}
          >
            <Icon className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
            <span>{item.message}</span>
          </li>
        );
      })}
    </ul>
  </IntelCard>
);
