'use client';

import { useMemo } from 'react';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { Minus, Plus, AlertTriangle, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { InventoryItem } from '@repo/api-types';

import {
  useInventory,
  useAdjustStock,
  useMarkReordered,
} from '@/hooks/useInventory';

const CATEGORY_ORDER = [
  'BEVERAGES',
  'LINENS',
  'TOILETRIES',
  'CULINARY',
  'EQUIPMENT',
];

const pretty = (c: string) =>
  c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();

type StockLevel = 'ok' | 'low' | 'out';

function levelOf(item: InventoryItem): StockLevel {
  if (item.currentStock <= 0) return 'out';
  if (item.currentStock <= item.reorderThreshold) return 'low';
  return 'ok';
}

export const InventoryPage = () => {
  const { data: items = [], isLoading } = useInventory();
  const adjust = useAdjustStock();
  const reorder = useMarkReordered();

  const lowItems = items.filter((i) => levelOf(i) !== 'ok');

  const grouped = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    const keys = [...map.keys()].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
    );
    return keys.map((k) => ({ category: k, items: map.get(k)! }));
  }, [items]);

  const doAdjust = (id: string, delta: number) =>
    adjust.mutate(
      { id, delta, reason: delta > 0 ? 'Restock' : 'Used' },
      { onError: (e) => toast.error((e as Error).message) },
    );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-manager-border"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lowItems.length > 0 ? (
        <div className="rounded-xl border border-[#e8c4b8] bg-[#fdf3ee] p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-[#b45309]" />
            <p className="text-sm font-semibold text-manager-text">
              {lowItems.length} item{lowItems.length === 1 ? '' : 's'} need
              attention
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {lowItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-manager-text">
                  {item.name}{' '}
                  <span className="text-manager-text-muted">
                    · {item.currentStock} {item.unit} left
                  </span>
                </span>
                {item.isOnOrder ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1e7e34]">
                    <PackageCheck className="size-3.5" /> On order
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      reorder.mutate(item.id, {
                        onSuccess: () => toast.success('Marked as reordered'),
                        onError: (e) => toast.error((e as Error).message),
                      })
                    }
                  >
                    Mark as reordered
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {grouped.map(({ category, items: catItems }) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-manager-text-muted">
            {pretty(category)}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catItems.map((item) => {
              const level = levelOf(item);
              const max =
                item.maxStock ??
                Math.max(item.reorderThreshold * 2, item.currentStock, 1);
              const pct = Math.min(
                100,
                Math.round((item.currentStock / max) * 100),
              );
              const barColor =
                level === 'out'
                  ? 'bg-[#b42318]'
                  : level === 'low'
                    ? 'bg-[#b45309]'
                    : 'bg-[#1e7e34]';
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-manager-border bg-manager-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-manager-text">
                        {item.name}
                      </p>
                      <p className="text-xs text-manager-text-muted">
                        Reorder at {item.reorderThreshold} {item.unit}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-manager-text">
                      {item.currentStock}
                      <span className="text-manager-text-muted">
                        {' '}
                        {item.unit}
                      </span>
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-manager-border">
                    <div
                      className={cn('h-full rounded-full', barColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {item.isOnOrder ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1e7e34]">
                        <PackageCheck className="size-3.5" /> On order
                      </span>
                    ) : (
                      <span className="text-xs text-manager-text-muted">
                        {level === 'ok' ? 'In stock' : 'Low stock'}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Use one ${item.name}`}
                        disabled={item.currentStock <= 0 || adjust.isPending}
                        onClick={() => doAdjust(item.id, -1)}
                        className="flex size-8 items-center justify-center rounded-md border border-manager-border text-manager-text hover:bg-manager-main disabled:opacity-40"
                      >
                        <Minus className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        disabled={adjust.isPending}
                        onClick={() => doAdjust(item.id, 1)}
                        className="flex size-8 items-center justify-center rounded-md border border-manager-border text-manager-text hover:bg-manager-main disabled:opacity-40"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {items.length === 0 ? (
        <p className="rounded-xl border border-manager-border bg-manager-card px-4 py-10 text-center text-sm text-manager-text-muted">
          No inventory items yet.
        </p>
      ) : null}
    </div>
  );
};
