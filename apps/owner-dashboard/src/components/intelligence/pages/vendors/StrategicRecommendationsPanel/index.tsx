'use client';

import { cn } from '@repo/ui/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { vendorStrategicRecommendations } from '@/lib/mock-data';
import { useVendorPerformance, useVendorForecast } from '@/hooks/useAnalytics';
import type { VendorPerfRow, VendorForecastRow } from '@/lib/api/analytics';
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

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// Derive advisory recommendations purely from real vendor performance + the
// demand forecast. Nothing here is hand-written per vendor — the sentences are
// generated from each vendor's own bookings, revenue, rating and run-rate.
function buildRecommendations(
  perf: VendorPerfRow[],
  forecast: VendorForecastRow[],
): VendorRecommendation[] {
  const active = perf.filter((v) => v.bookings > 0);
  if (active.length === 0) return [];

  const fc = new Map(forecast.map((f) => [f.id, f]));
  const recs: VendorRecommendation[] = [];
  const used = new Set<string>();

  // 1) Top revenue contributor → expand.
  const top = [...active].sort((a, b) => b.revenue - a.revenue)[0];
  if (top) {
    used.add(top.id);
    recs.push({
      id: `rec-top-${top.id}`,
      variant: 'success',
      title: `${top.name}:`,
      message: `top revenue contributor at ${money(top.revenue)} across ${top.bookings} bookings${
        top.rating ? ` (${top.rating.toFixed(1)}★)` : ''
      }. Expand its allocation and protect peak-season slots.`,
    });
  }

  // 2) Strongest accelerating demand (forecast = High) → secure capacity.
  const rising = active
    .map((v) => ({ v, f: fc.get(v.id) }))
    .filter((x) => x.f?.recommendation.startsWith('High') && !used.has(x.v.id))
    .sort(
      (a, b) =>
        (b.f!.projectedNextQuarter ?? 0) - (a.f!.projectedNextQuarter ?? 0),
    )[0];
  if (rising) {
    used.add(rising.v.id);
    recs.push({
      id: `rec-rising-${rising.v.id}`,
      variant: 'info',
      title: `${rising.v.name}:`,
      message: `demand is accelerating — about ${rising.f!.projectedNextQuarter} bookings projected next quarter (${rising.f!.monthlyRate}/mo). Lock in capacity blocks before Q3.`,
    });
  }

  // 3) At-risk vendor → review. Priority: a softening forecast (Low), else the
  //    lowest-rated active vendor, else any non-active vendor with history.
  const softening = active
    .map((v) => ({ v, f: fc.get(v.id) }))
    .filter((x) => x.f?.recommendation.startsWith('Low') && !used.has(x.v.id))
    .sort((a, b) => (a.f!.monthlyRate ?? 0) - (b.f!.monthlyRate ?? 0))[0];
  const lowestRated = [...active]
    .filter((v) => v.rating > 0 && !used.has(v.id))
    .sort((a, b) => a.rating - b.rating)[0];
  const dormant = perf.find((v) => v.status !== 'ACTIVE' && !used.has(v.id));

  if (softening) {
    used.add(softening.v.id);
    recs.push({
      id: `rec-soft-${softening.v.id}`,
      variant: 'warning',
      title: `${softening.v.name}:`,
      message: `run-rate has cooled to ${softening.f!.monthlyRate}/mo. Renegotiate the block or line up a backup before committing to next season.`,
    });
  } else if (lowestRated && lowestRated.rating < 4.5) {
    used.add(lowestRated.id);
    recs.push({
      id: `rec-rating-${lowestRated.id}`,
      variant: 'warning',
      title: `${lowestRated.name}:`,
      message: `guest rating sits at ${lowestRated.rating.toFixed(1)}★ — below the estate standard. Audit recent service quality before renewing.`,
    });
  } else if (dormant) {
    used.add(dormant.id);
    recs.push({
      id: `rec-dormant-${dormant.id}`,
      variant: 'warning',
      title: `${dormant.name}:`,
      message: `currently ${dormant.status === 'ON_LEAVE' ? 'on leave' : 'inactive'} with no recent bookings. Confirm availability or remove from the active roster.`,
    });
  }

  // 4) Boutique standout — high rating, modest volume → promote.
  const standout = [...active]
    .filter((v) => v.rating >= 4.8 && !used.has(v.id))
    .sort((a, b) => b.rating - a.rating || a.bookings - b.bookings)[0];
  if (standout) {
    used.add(standout.id);
    recs.push({
      id: `rec-standout-${standout.id}`,
      variant: 'success',
      title: `${standout.name}:`,
      message: `earns a ${standout.rating.toFixed(1)}★ rating on ${standout.bookings} bookings. Feature it in pre-arrival concierge offers to grow volume.`,
    });
  }

  return recs;
}

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

export const StrategicRecommendationsPanel = () => {
  const { data: perf } = useVendorPerformance();
  const { data: forecast } = useVendorForecast();

  const live = perf && forecast ? buildRecommendations(perf, forecast) : [];
  const items = live.length > 0 ? live : vendorStrategicRecommendations;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <h3 className="mb-3 shrink-0 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Strategic Recommendations
      </h3>
      <IntelCard className="flex flex-1 flex-col rounded-xl p-4">
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <RecommendationItem key={item.id} item={item} />
          ))}
        </ul>
      </IntelCard>
    </section>
  );
};
