'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import {
  BROKER_HOLD_STATUS_LABELS,
  formatPrice,
  holdTimeLeft,
} from '@repo/api-types';
import type { BrokerHold } from '@repo/api-types';

import { toast } from 'sonner';
import {
  useBrokerHolds,
  useConfirmHold,
  useDeleteHold,
  useReleaseHold,
} from '@/hooks/useBrokerHolds';

const STATUS_STYLES: Record<BrokerHold['status'], string> = {
  PENDING: 'bg-[#fdf4e3] text-[#8a6d3b] border-[#e8d5ae]',
  CONFIRMED: 'bg-[#eaf4ef] text-[#1f7a5c] border-[#bfe0d0]',
  RELEASED: 'bg-manager-bg text-manager-text-muted border-manager-border',
  EXPIRED: 'bg-manager-bg text-manager-text-muted border-manager-border',
};

/** "13h 40m left", or what became of it. */
const countdown = (hold: BrokerHold): string => {
  if (hold.status !== 'PENDING') {
    const at = hold.confirmedAt ?? hold.releasedAt ?? hold.expiresAt;
    return `${BROKER_HOLD_STATUS_LABELS[hold.status]} · ${format(parseISO(at), 'MMM d, h:mm a')}`;
  }
  const left = holdTimeLeft(hold.expiresAt);
  if (!left) return 'Expiring now';
  return left.hours > 0
    ? `${left.hours}h ${left.minutes}m left`
    : `${left.minutes}m left`;
};

/**
 * What brokers are sitting on, and the two things the estate can do about it.
 *
 * Deliberately a queue rather than a calendar. The estate already has a
 * calendar; what it lacked was a list of decisions with a clock running on each
 * one. Holds resolve themselves if ignored, so this screen's job is to make the
 * ones worth acting on obvious before they lapse.
 */
export const BrokerHoldsPage = () => {
  const { data: holds, isLoading, isError } = useBrokerHolds();
  const confirm = useConfirmHold();
  const release = useReleaseHold();
  const remove = useDeleteHold();
  const [acting, setActing] = useState<string | null>(null);
  // Resolved holds start folded away. They are reassurance, not work, and with
  // contact details on every card an open list of them buried the two or three
  // that actually need Rodrigo.
  const [showResolved, setShowResolved] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-manager-border/50"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="m-6 rounded-xl border border-[#f4c8c1] bg-[#fdf3f1] p-6 text-sm text-[#8f2b21]">
        Couldn&rsquo;t load broker holds. Refresh, or check that the API is up.
      </div>
    );
  }

  const live = (holds ?? []).filter((h) => h.status === 'PENDING');
  const rest = (holds ?? []).filter((h) => h.status !== 'PENDING');

  return (
    <div className="space-y-6 p-6">
      {/* The single most important thing on this screen: these dates are not
          blocked anywhere else. The estate agreed to that trade, but it must
          never be a surprise when a direct booking lands on a held week. */}
      <div className="flex items-start gap-3 rounded-xl border border-[#e8d5ae] bg-[#fdf4e3] px-4 py-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#8a6d3b]" />
        <p className="text-xs leading-relaxed text-[#7a5f33]">
          Held dates are <strong>not</strong> blocked in Lodgify. A direct
          booking can still land on top of them — confirm the ones you intend to
          keep and block those dates in Lodgify yourself.
        </p>
      </div>

      {live.length === 0 && rest.length === 0 ? (
        <div className="rounded-xl border border-manager-border bg-white px-6 py-14 text-center">
          <CalendarClock className="mx-auto mb-3 size-6 text-manager-text-muted" />
          <p className="text-sm font-medium text-manager-text">
            No broker holds
          </p>
          <p className="mx-auto mt-1 max-w-[42ch] text-xs text-manager-text-muted">
            When a broker holds dates from the availability page, they appear
            here with 48 hours on the clock.
          </p>
        </div>
      ) : null}

      {live.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-manager-text-muted">
            Waiting on you · {live.length}
          </h2>
          <div className="space-y-3">
            {live.map((hold) => (
              <HoldCard
                key={hold.id}
                hold={hold}
                busy={acting === hold.id}
                onConfirm={() => {
                  setActing(hold.id);
                  confirm.mutate(hold.id, { onSettled: () => setActing(null) });
                }}
                onRelease={() => {
                  setActing(hold.id);
                  release.mutate(
                    { id: hold.id },
                    { onSettled: () => setActing(null) },
                  );
                }}
              />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          {/* Folded by default. These are reassurance, not work — and with
              contact details on every card, an open list of them buried the two
              or three that actually need answering. */}
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            aria-expanded={showResolved}
            className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-xs font-semibold uppercase tracking-wider text-manager-text-muted hover:text-manager-text"
          >
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform',
                showResolved && 'rotate-180',
              )}
              aria-hidden
            />
            Recently resolved · {rest.length}
          </button>

          {showResolved && (
            <div className="mt-3 space-y-3">
              {rest.map((hold) => (
                <HoldCard
                  key={hold.id}
                  hold={hold}
                  busy={acting === hold.id}
                  onDelete={
                    hold.status === 'CONFIRMED'
                      ? undefined
                      : () => {
                          setActing(hold.id);
                          remove.mutate(hold.id, {
                            onSettled: () => setActing(null),
                          });
                        }
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

/** Everything Lodgify asks for, in one clipboard paste. */
const forLodgify = (hold: BrokerHold): string =>
  [
    `${hold.brokerName}${hold.brokerAgency ? ` (${hold.brokerAgency})` : ''}`,
    hold.brokerEmail ?? 'no email recorded',
    `${format(parseISO(hold.checkIn), 'd MMM yyyy')} → ${format(parseISO(hold.checkOut), 'd MMM yyyy')}`,
    `${hold.nights} nights · ${hold.guestCount ?? '?'} guests`,
  ].join('\n');

const HoldCard = ({
  hold,
  busy,
  onConfirm,
  onRelease,
  onDelete,
}: {
  hold: BrokerHold;
  busy?: boolean;
  onConfirm?: () => void;
  onRelease?: () => void;
  onDelete?: () => void;
}) => {
  const pending = hold.status === 'PENDING';

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5',
        pending ? 'border-manager-border' : 'border-manager-border opacity-75',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-manager-text">
              {hold.brokerName}
              {hold.brokerAgency && (
                <span className="text-manager-text-muted">
                  {' '}
                  · {hold.brokerAgency}
                </span>
              )}
            </p>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                STATUS_STYLES[hold.status],
              )}
            >
              {countdown(hold)}
            </span>
          </div>

          <p className="mt-1.5 text-sm text-manager-text">
            {format(parseISO(hold.checkIn), 'EEE d MMM')} —{' '}
            {format(parseISO(hold.checkOut), 'EEE d MMM yyyy')}
            <span className="text-manager-text-muted">
              {' '}
              · {hold.nights} nights
            </span>
          </p>

          <p className="mt-1 text-xs text-manager-text-muted">
            {hold.estimatedTotal == null ? (
              'Not priced — no rate for those nights'
            ) : (
              <>
                {formatPrice(Number(hold.estimatedTotal))} estimated
                {hold.estimateSource !== 'lodgify' && ' · indicative'}
              </>
            )}
          </p>

          {/* Both are null on holds placed before they were asked for. Saying
              so is better than an empty space that reads as a rendering fault. */}
          <p className="mt-1 text-xs text-manager-text-muted">
            {hold.guestCount != null
              ? `${hold.guestCount} guests`
              : 'Guests not recorded'}
            {' · '}
            {hold.brokerEmail ? (
              <a
                href={`mailto:${hold.brokerEmail}`}
                className="underline underline-offset-2 hover:text-manager-text"
              >
                {hold.brokerEmail}
              </a>
            ) : (
              'Email not recorded'
            )}
          </p>

          {hold.note && (
            <p className="mt-2 max-w-[60ch] rounded-lg bg-manager-bg px-3 py-2 text-xs italic text-manager-text-muted">
              &ldquo;{hold.note}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Retyping four fields into another tab is where transcription
              errors come from — and a wrong email on a booking is one nobody
              notices until the guest doesn't reply. */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(forLodgify(hold));
              toast.success('Copied — paste into Lodgify');
            }}
            className="border-manager-border bg-white text-manager-text"
          >
            <Copy className="mr-1.5 size-3.5" />
            Copy for Lodgify
          </Button>

          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              disabled={busy}
              aria-label="Remove this hold"
              className="border-manager-border bg-white text-manager-text-muted hover:text-[#b42318]"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>

        {pending && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onRelease}
              disabled={busy}
              className="border-manager-border bg-white text-manager-text"
            >
              <X className="mr-1.5 size-4" />
              Release
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="bg-[#1f7a5c] text-white hover:opacity-90"
            >
              {busy ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Check className="mr-1.5 size-4" />
              )}
              Confirm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
