'use client';

import { useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { CalendarDays, Coffee, Gem, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import { formatPrice } from '@repo/api-types';
import type { DiningOrderItem, EmDiningQueueItem } from '@repo/api-types';

import {
  useCancelDining,
  useConfirmDining,
  useDiningQueue,
} from '@/hooks/useDining';
import { KitchenSheet } from '@/components/manager/pages/dining/KitchenSheet';

/** A meal today or tomorrow is being cooked for now, not planned for. */
const URGENT_WITHIN_DAYS = 1;

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACKS: 'Snacks',
  BEVERAGES: 'Beverages',
};

function partyOf(r: EmDiningQueueItem): string {
  const p = r.booking?.primaryGuest;
  if (!p) return 'Unassigned stay';
  return `${p.firstName} ${p.lastName}`.trim() || p.email;
}

/**
 * The kitchen's day, and the handful of things still waiting on a person.
 *
 * Sittings used to queue here for confirmation, which was ceremony: a table
 * inside the estate's own window, on a day it serves, for a party already in
 * the villa. Removing that is what freed the page to become the sheet the chef
 * works from. Snacks, drinks and chargeable additions keep their
 * acknowledgement below — those genuinely arrive unannounced.
 */
export const DiningQueuePage = () => {
  const [tab, setTab] = useState<'kitchen' | 'waiting'>('kitchen');
  const { data: waiting = [] } = useDiningQueue();

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-lg border border-manager-border bg-white p-0.5">
        <button
          type="button"
          onClick={() => setTab('kitchen')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium',
            tab === 'kitchen'
              ? 'bg-manager-accent text-white'
              : 'text-manager-text-muted',
          )}
        >
          <CalendarDays className="size-4" />
          The kitchen&rsquo;s week
        </button>
        <button
          type="button"
          onClick={() => setTab('waiting')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium',
            tab === 'waiting'
              ? 'bg-manager-accent text-white'
              : 'text-manager-text-muted',
          )}
        >
          <Inbox className="size-4" />
          Waiting on you
          {waiting.length > 0 && (
            <span
              className={cn(
                'ml-0.5 rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                tab === 'waiting'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#fdecea] text-[#b42318]',
              )}
            >
              {waiting.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'kitchen' ? <KitchenSheet /> : <OrdersWaiting />}
    </div>
  );
};

const OrdersWaiting = () => {
  const { data: requests = [], isLoading } = useDiningQueue();
  const confirm = useConfirmDining(null);
  const cancel = useCancelDining(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-manager-border" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-manager-border bg-manager-card p-12 text-center">
        <Inbox
          className="mx-auto mb-3 size-6 text-manager-text-muted"
          aria-hidden
        />
        <p className="text-sm font-medium text-manager-text">
          Nothing waiting on you
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-manager-text-muted">
          Tables confirm themselves. Snacks, drinks and chargeable additions
          land here the moment a guest asks for one.
        </p>
      </div>
    );
  }

  const act = (
    kind: 'confirm' | 'cancel',
    r: EmDiningQueueItem,
    label: string,
  ) => {
    const mutation = kind === 'confirm' ? confirm : cancel;
    mutation.mutate(r.id, {
      onSuccess: () =>
        toast.success(
          kind === 'confirm' ? `${label} confirmed` : `${label} cancelled`,
          {
            description:
              kind === 'confirm'
                ? `${r.requestedByName} has been notified.`
                : `${r.requestedByName} has been notified.`,
          },
        ),
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-manager-text">
          Waiting on you
        </h2>
        <p className="mt-0.5 text-xs text-manager-text-muted">
          {requests.length} order{requests.length === 1 ? '' : 's'}, soonest
          first. Confirming or cancelling notifies the guest; an exclusive
          addition also goes on their folio.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {requests.map((r) => {
          const items = (r.items ?? []) as DiningOrderItem[];
          const amount = Number(r.totalAmount ?? 0);
          const chargeable = amount > 0;
          // The primary's decision, not the estate's — two people answering
          // two different questions. Shown, but not actionable, until they do.
          const awaitingPrimary = !r.primaryApproved;
          const when = r.date ? parseISO(r.date) : null;
          const daysAway = when
            ? differenceInCalendarDays(when, new Date())
            : null;
          const urgent = daysAway != null && daysAway <= URGENT_WITHIN_DAYS;
          const label = chargeable
            ? (items[0]?.name ?? 'Exclusive addition')
            : (MEAL_LABEL[r.mealType ?? ''] ?? 'Order');
          const busy =
            (confirm.isPending && confirm.variables === r.id) ||
            (cancel.isPending && cancel.variables === r.id);

          return (
            <li
              key={r.id}
              className="flex flex-col gap-3 rounded-lg border border-manager-border bg-manager-card p-4 sm:flex-row sm:items-center"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  chargeable ? 'bg-[#faf0dc]' : 'bg-[#eef2f6]',
                )}
                aria-hidden
              >
                {chargeable ? (
                  <Gem className="size-4 text-[#8a6d3b]" />
                ) : (
                  <Coffee className="size-4 text-[#3d6382]" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-manager-text">
                  {label}
                  {items.length > 0
                    ? ` · ${items.reduce((s, i) => s + i.quantity, 0)} items`
                    : ''}
                </p>
                <p className="mt-0.5 text-xs text-manager-text-muted">
                  {partyOf(r)}
                  {r.requestedByName !== partyOf(r)
                    ? ` · asked by ${r.requestedByName}`
                    : ''}
                  {when ? ` · ${format(when, 'MMM d')}` : ''}
                  {r.time ? ` · ${r.time}` : ''}
                  {r.requestedFor ? ` · for ${r.requestedFor}` : ''}
                  {r.linkedSittingId ? ' · with their sitting' : ''}
                </p>

                {awaitingPrimary && (
                  <p className="mt-1 text-xs font-medium text-[#8a6d3b]">
                    Waiting on the primary member to approve the charge
                  </p>
                )}

                {items.length > 0 ? (
                  <p className="mt-1 text-xs text-manager-text-muted">
                    {items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                ) : null}

                {/* Allergies are the one thing here that can actually hurt
                    someone, so they are never collapsed behind a detail view. */}
                {r.allergies ? (
                  <p className="mt-1 text-xs font-medium text-[#b42318]">
                    Allergies: {r.allergies}
                  </p>
                ) : null}
                {r.specialRequests || r.notes ? (
                  <p className="mt-1 text-xs italic text-manager-text-muted">
                    “{r.specialRequests || r.notes}”
                  </p>
                ) : null}
                {(r.lateArrivals ?? []).length > 0 ? (
                  <p className="mt-1 text-xs text-manager-text-muted">
                    {r.lateArrivals!.length} arriving late
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {chargeable && (
                  <span className="text-sm font-medium tabular-nums text-manager-text">
                    {formatPrice(amount)}
                  </span>
                )}
                {urgent && (
                  <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#b42318]">
                    {daysAway! <= 0 ? 'Today' : 'Tomorrow'}
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => act('cancel', r, label)}
                  disabled={busy}
                  className="border-manager-border bg-manager-card text-manager-text"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => act('confirm', r, label)}
                  disabled={busy || awaitingPrimary}
                  title={
                    awaitingPrimary
                      ? 'The primary member hasn’t approved this charge yet'
                      : undefined
                  }
                  className="bg-manager-accent text-white hover:opacity-90"
                >
                  {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                  {chargeable ? 'Confirm & charge' : 'Confirm'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
