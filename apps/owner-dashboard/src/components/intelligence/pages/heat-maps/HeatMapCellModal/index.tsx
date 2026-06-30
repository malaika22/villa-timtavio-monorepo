'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';

import { useHeatMapCell } from '@/hooks/useAnalytics';

type Tab = 'timeline' | 'cost' | 'recommendations';

const TABS: { id: Tab; label: string }[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'cost', label: 'Cost analysis' },
  { id: 'recommendations', label: 'Recommendations' },
];

const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const HeatMapCellModal = ({
  cell,
  onClose,
}: {
  cell: { space: string; timeBlock: string } | null;
  onClose: () => void;
}) => {
  const [tab, setTab] = useState<Tab>('timeline');
  const { data, isLoading } = useHeatMapCell(cell);

  return (
    <Dialog open={!!cell} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {cell?.space} · {cell?.timeBlock}
          </DialogTitle>
          <DialogDescription>
            {data ? `${data.total} service events` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-[#f4f1eb] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                tab === t.id
                  ? 'bg-white text-[#2b2824] shadow-sm'
                  : 'text-[#6b6661]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-[180px]">
          {isLoading || !data ? (
            <div className="h-40 animate-pulse rounded-lg bg-[#f0ede8]" />
          ) : tab === 'timeline' ? (
            data.timeline.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#9a9288]">
                No events in this block.
              </p>
            ) : (
              <ul className="divide-y divide-[#f1ece4]">
                {data.timeline.map((e, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-[#2b2824]">
                      {e.serviceType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="flex items-center gap-2 text-[#9a9288]">
                      {e.hasCost ? (
                        <span className="rounded-full bg-[#fdf3e3] px-2 py-0.5 text-[10px] text-[#8b6914]">
                          billable
                        </span>
                      ) : null}
                      {fmtTime(e.time)}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : tab === 'cost' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#e8e4de] bg-[#fdf6ec] p-3 text-center">
                  <p className="font-cormorant text-3xl text-[#8b6914]">
                    {data.withCost}
                  </p>
                  <p className="text-xs text-[#9a9288]">Billable</p>
                </div>
                <div className="rounded-lg border border-[#e8e4de] bg-[#f3f9f5] p-3 text-center">
                  <p className="font-cormorant text-3xl text-[#3a5e48]">
                    {data.withoutCost}
                  </p>
                  <p className="text-xs text-[#9a9288]">Complimentary</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {data.byType.map((b) => (
                  <li key={b.type} className="flex justify-between text-sm">
                    <span className="text-[#2b2824]">
                      {b.type.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="text-[#9a9288]">{b.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="space-y-2 text-sm text-[#2b2824]">
              {data.total >= 6 ? (
                <li>· High-traffic block — ensure staffing coverage for {cell?.space}.</li>
              ) : data.total === 0 ? (
                <li>· Quiet block — an opportunity to schedule maintenance.</li>
              ) : (
                <li>· Moderate activity — current staffing looks sufficient.</li>
              )}
              {data.withCost > data.withoutCost ? (
                <li>· Mostly billable — strong upsell window; consider a featured offer.</li>
              ) : (
                <li>· Mostly complimentary — a candidate for a paid upgrade.</li>
              )}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
