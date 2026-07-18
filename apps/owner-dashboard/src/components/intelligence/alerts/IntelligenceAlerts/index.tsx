import { cn } from '@repo/ui/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import type { IntelligenceAlert } from '@/types';

const styles = {
  success: {
    bg: 'bg-intel-success-bg',
    text: 'text-intel-success',
    icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-intel-warning-bg',
    text: 'text-intel-warning',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-intel-info-bg',
    text: 'text-intel-info',
    icon: Info,
  },
  peach: {
    bg: 'bg-intel-peach-bg',
    text: 'text-intel-peach',
    icon: AlertCircle,
  },
};

export const IntelligenceAlerts = ({
  alerts,
}: {
  alerts: IntelligenceAlert[];
}) => (
  <IntelCard className="flex h-full min-h-0 flex-col p-4">
    <h3 className="text-sm font-medium text-intel-text">Intelligence Alerts</h3>
    <ul className="mt-3 flex flex-col gap-2">
      {alerts.map((a) => {
        const s = styles[a.variant];
        const Icon = s.icon;
        return (
          <li
            key={a.id}
            className={cn(
              'flex gap-2.5 rounded-md px-3 py-2.5 text-[11px] leading-relaxed',
              s.bg,
              s.text,
            )}
          >
            <Icon className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
            <span>{a.message}</span>
          </li>
        );
      })}
    </ul>
  </IntelCard>
);
