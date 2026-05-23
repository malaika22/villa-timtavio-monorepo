import { cn } from '@repo/ui/lib/utils';

import type { DashboardVariant } from './dashboard-tokens';
import { MetricCard } from './MetricCard';
import type { DashboardMetricCard } from './types';

export const MetricCardGrid = ({
  metrics,
  variant = 'intel',
  columns = 4,
}: {
  metrics: DashboardMetricCard[];
  variant?: DashboardVariant;
  columns?: 2 | 3 | 4;
}) => {
  const colClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid grid-cols-1 gap-4', colClass)}>
      {metrics.map((m) => (
        <MetricCard key={m.id} metric={m} variant={variant} />
      ))}
    </div>
  );
};
