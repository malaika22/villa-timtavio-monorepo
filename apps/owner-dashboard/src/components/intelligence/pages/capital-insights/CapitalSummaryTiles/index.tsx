'use client';

import { MetricCard } from '@/components/intelligence/cards/MetricCard';
import { KpiSkeleton } from '@/components/intelligence/ui/Skeletons';
import { useEquipmentAnalysis } from '@/hooks/useAnalytics';
import type { MetricCard as MetricCardType } from '@/types';

const compactMoney = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n).toLocaleString()}`;
};

// Summary tiles derived from the live equipment analysis. Nothing fabricated:
// annual rental spend, projected own-asset savings and average payback all come
// from the same rows the Equipment Tracker renders.
export const CapitalSummaryTiles = () => {
  const { data, isLoading } = useEquipmentAnalysis();

  let tiles: MetricCardType[] = [
    { id: 'annual-rental-spend', label: 'ANNUAL RENTAL SPEND', value: '$0' },
    {
      id: 'own-asset-savings',
      label: 'POTENTIAL OWN-ASSET SAVINGS',
      value: '$0',
    },
    { id: 'payback-avg', label: 'PAYBACK PERIOD (AVG)', value: '—' },
  ];

  if (data && data.items.length > 0) {
    const items = data.items;
    const annualRental = items.reduce((s, i) => s + i.annualRental, 0);
    const buys = items.filter((i) => i.recommendation === 'BUY');

    // Payback (years) per buy = break-even uses ÷ uses per year. Average across
    // recommended purchases; omit the tile's value gracefully if none qualify.
    const paybacks = buys
      .map((i) =>
        i.breakEvenUses && i.usesPerYear > 0
          ? i.breakEvenUses / i.usesPerYear
          : null,
      )
      .filter((v): v is number => v !== null);
    const avgPayback =
      paybacks.length > 0
        ? paybacks.reduce((s, v) => s + v, 0) / paybacks.length
        : null;

    tiles = [
      {
        id: 'annual-rental-spend',
        label: 'ANNUAL RENTAL SPEND',
        value: compactMoney(annualRental),
        subtext: `Across ${items.length} tracked asset${items.length === 1 ? '' : 's'}`,
      },
      {
        id: 'own-asset-savings',
        label: 'POTENTIAL OWN-ASSET SAVINGS',
        value: compactMoney(data.totalProjectedSavings),
        subtext: `Over 24 months if ${buys.length} BUY item${buys.length === 1 ? '' : 's'} owned`,
      },
      {
        id: 'payback-avg',
        label: 'PAYBACK PERIOD (AVG)',
        value: avgPayback !== null ? `${avgPayback.toFixed(1)} yrs` : '—',
        subtext: 'Across recommended purchases',
      },
    ];
  }

  if (isLoading) return <KpiSkeleton count={3} cols="lg:grid-cols-3" />;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
};
