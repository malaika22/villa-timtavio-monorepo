import { MetricCard } from '@/components/intelligence/cards/MetricCard';
import type { MetricCard as MetricCardType } from '@/types';

export const MetricCardGrid = ({ metrics }: { metrics: MetricCardType[] }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {metrics.map((m) => (
      <MetricCard key={m.id} metric={m} />
    ))}
  </div>
);
