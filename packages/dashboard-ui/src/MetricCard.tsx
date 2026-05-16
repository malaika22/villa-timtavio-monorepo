import { cn } from '@repo/ui/lib/utils';

import { DashboardCard } from './DashboardCard';
import { DashboardLabel } from './DashboardLabel';
import { getDashboardTokens, type DashboardVariant } from './dashboard-tokens';
import type { DashboardMetricCard } from './types';

export const MetricCard = ({
  metric,
  variant = 'intel',
}: {
  metric: DashboardMetricCard;
  variant?: DashboardVariant;
}) => {
  const t = getDashboardTokens(variant);
  const isManager = variant === 'manager';

  return (
    <DashboardCard variant={variant} className={isManager ? 'p-5' : 'p-4'}>
      <DashboardLabel variant={variant}>{metric.label}</DashboardLabel>
      <p
        className={cn(
          'mt-2 font-cormorant leading-none tracking-tight',
          isManager ? 'text-[36px]' : 'text-[34px]',
          t.text,
        )}
      >
        {metric.value}
      </p>
      {metric.trend ? (
        <p
          className={cn(
            'mt-2.5 leading-snug',
            isManager ? 'text-sm' : 'text-[11px]',
            metric.trendDirection === 'up' && t.success,
            metric.trendDirection === 'down' && t.danger,
            metric.trendDirection === 'neutral' && t.textMuted,
            metric.trendDirection === 'warning' && t.warning,
            !metric.trendDirection && t.success,
          )}
        >
          {metric.trend}
        </p>
      ) : null}
      {metric.subtext ? (
        <p className={cn('mt-2.5', isManager ? 'text-sm' : 'text-[11px]', t.textMuted)}>
          {metric.subtext}
        </p>
      ) : null}
    </DashboardCard>
  );
};
