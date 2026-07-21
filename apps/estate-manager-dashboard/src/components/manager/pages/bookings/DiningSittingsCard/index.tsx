'use client';

import { DashboardCard } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';
import {
  CheckCircle2,
  UtensilsCrossed,
  Coffee,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useDining, useConfirmDining } from '@/hooks/useDining';
import type { DiningOrderItem, DiningRequest } from '@repo/api-types';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACKS: 'Snacks',
  BEVERAGES: 'Beverages',
};

export const DiningSittingsCard = ({ bookingId }: { bookingId: string }) => {
  const { data: requests, isLoading } = useDining(bookingId);
  const confirm = useConfirmDining(bookingId);

  return (
    <DashboardCard
      variant="manager"
      padding={false}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-[#ebe6df] px-5 py-3.5">
        <h3 className="text-sm font-semibold text-manager-text">Dining</h3>
        <span className="text-xs text-manager-text-muted">
          Sittings &amp; orders
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-manager-border"
            />
          ))}
        </div>
      ) : !requests || requests.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-manager-text-muted">
          No dining sittings or orders yet for this stay.
        </p>
      ) : (
        <ul className="divide-y divide-[#ebe6df]">
          {requests.map((r) => (
            <DiningRow
              key={r.id}
              request={r}
              onConfirm={() => confirm.mutate(r.id)}
              confirming={confirm.isPending}
            />
          ))}
        </ul>
      )}
    </DashboardCard>
  );
};

function DiningRow({
  request: r,
  onConfirm,
  confirming,
}: {
  request: DiningRequest;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const isSitting = r.kind === 'SITTING';
  const items = (r.items ?? []) as DiningOrderItem[];

  return (
    <li className="px-5 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f3efe9]">
            {isSitting ? (
              <UtensilsCrossed className="size-3.5 text-[#7a5c3a]" />
            ) : (
              <Coffee className="size-3.5 text-[#7a5c3a]" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-manager-text">
              {isSitting
                ? `${MEAL_LABEL[r.mealType ?? ''] ?? 'Sitting'}${r.partySize ? ` · ${r.partySize} guests` : ''}`
                : `Order · ${items.length} item${items.length === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-manager-text-muted">
              {isSitting
                ? `${r.date ? format(new Date(r.date), 'MMM d') : ''}${r.time ? ` at ${r.time}` : ''}`
                : r.requestedFor
                  ? `For ${r.requestedFor}`
                  : 'As soon as possible'}
              {' · '}
              {r.requestedByName}
            </p>
            {!isSitting && items.length > 0 && (
              <p className="mt-1 text-xs text-manager-text">
                {items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
              </p>
            )}
            {r.allergies && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#9a3a30]">
                <AlertTriangle className="size-3" /> {r.allergies}
              </p>
            )}
            {r.specialRequests && (
              <p className="mt-0.5 text-xs italic text-manager-text-muted">
                “{r.specialRequests}”
              </p>
            )}
            {!isSitting && r.notes && (
              <p className="mt-0.5 text-xs italic text-manager-text-muted">
                “{r.notes}”
              </p>
            )}

            {/* Late arrivals flagged by secondary guests against this sitting */}
            {isSitting && (r.lateArrivals ?? []).length > 0 && (
              <div className="mt-2 rounded-lg border border-[#f0e4d6] bg-[#fdf8f1] px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9a6a23]">
                  Arriving late · {r.lateArrivals!.length}
                </p>
                <ul className="mt-1 space-y-1">
                  {r.lateArrivals!.map((l, i) => (
                    <li key={i} className="text-xs text-manager-text">
                      <span className="font-medium">{l.name}</span>
                      {l.note ? (
                        <span className="text-manager-text-muted">
                          {' '}
                          — {l.note}
                        </span>
                      ) : null}
                      {l.allergies && (
                        <span className="ml-1 inline-flex items-center gap-1 font-medium text-[#9a3a30]">
                          <AlertTriangle className="size-3" /> {l.allergies}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {r.status === 'CONFIRMED' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f1e9] px-2.5 py-1 text-xs font-medium text-[#3a6448]">
              <CheckCircle2 className="size-3.5" /> Confirmed
            </span>
          ) : (
            <button
              onClick={onConfirm}
              disabled={confirming}
              className={cn(
                'rounded-lg bg-[#4a7c59] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3a6448] disabled:opacity-60',
              )}
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
