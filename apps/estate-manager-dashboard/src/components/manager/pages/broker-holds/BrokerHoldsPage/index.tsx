'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';

import { stayDate, stayDateLong, stayDateWithYear } from '@/lib/stay-date';
import {
  CalendarClock,
  CalendarX,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Trash2,
  TriangleAlert,
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
import { BrokerHoldReleaseDialog } from '@/components/manager/pages/broker-holds/BrokerHoldReleaseDialog';
import {
  useBrokerHolds,
  useConfirmHold,
  useDeleteHold,
} from '@/hooks/useBrokerHolds';

// `manager-main`, not the `manager-bg` these two carried for months. The theme
// defines --manager-main, --manager-card and the rest but never a `bg`, so
// Tailwind emitted no rule at all and both pills drew on transparent.
const STATUS_STYLES: Record<BrokerHold['status'], string> = {
  PENDING: 'bg-[#fdf4e3] text-[#8a6d3b] border-[#e8d5ae]',
  CONFIRMED: 'bg-[#eaf4ef] text-[#1f7a5c] border-[#bfe0d0]',
  RELEASED: 'bg-manager-main text-manager-text-muted border-manager-border',
  EXPIRED: 'bg-manager-main text-manager-text-muted border-manager-border',
};

/** Below this, the clock stops being information and starts being a warning. */
const URGENT_HOURS = 6;

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

const isUrgent = (hold: BrokerHold): boolean => {
  if (hold.status !== 'PENDING') return false;
  const left = holdTimeLeft(hold.expiresAt);
  return left === null || left.hours < URGENT_HOURS;
};

/**
 * What brokers are sitting on, and the things the estate can do about it.
 *
 * Deliberately a queue rather than a calendar. The estate already has a
 * calendar; what it lacked was a list of decisions with a clock running on each
 * one. Holds resolve themselves if ignored, so this screen's job is to make the
 * ones worth acting on obvious before they lapse.
 */
export const BrokerHoldsPage = () => {
  const { data: holds, isLoading, isError } = useBrokerHolds();
  const confirm = useConfirmHold();
  const remove = useDeleteHold();
  const [acting, setActing] = useState<string | null>(null);
  // One dialog for the whole list rather than one per card: releasing is now
  // a confirmed action for pending holds too, since either way it sends the
  // broker an email.
  const [releasing, setReleasing] = useState<BrokerHold | null>(null);
  // Open by default. Resolved holds stopped being pure reassurance the moment
  // a confirmed one grew a Release button — some of them are work now, and a
  // section you have to remember to unfold is a section nobody unfolds.
  const [showResolved, setShowResolved] = useState(true);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 p-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl bg-manager-border/50"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-[#f4c8c1] bg-[#fdf3f1] p-6 text-sm text-[#8f2b21]">
        Couldn&rsquo;t load broker holds. Refresh, or check that the API is up.
      </div>
    );
  }

  const live = (holds ?? []).filter((h) => h.status === 'PENDING');
  const rest = (holds ?? []).filter((h) => h.status !== 'PENDING');

  return (
    // Capped rather than full-bleed. Every fact on a hold is short, so on a
    // wide monitor the old layout stranded the buttons a foot to the right of
    // the name they belonged to.
    <div className="mx-auto max-w-4xl space-y-6 p-6">
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
                onRelease={() => setReleasing(hold)}
              />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            aria-expanded={showResolved}
            className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-xs font-semibold uppercase tracking-wider text-manager-text-muted hover:text-manager-text"
          >
            <ChevronDown
              className={cn(
                'size-3.5 transition-transform',
                !showResolved && '-rotate-90',
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
                  // A confirmed hold is released, not deleted — that row is
                  // how a booking came about. Releasing it stops it holding
                  // nights and then, and only then, it can be removed.
                  onRelease={
                    hold.status === 'CONFIRMED'
                      ? () => setReleasing(hold)
                      : undefined
                  }
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

      {releasing && (
        <BrokerHoldReleaseDialog
          key={releasing.id}
          open
          onOpenChange={(next) => {
            if (!next) setReleasing(null);
          }}
          hold={releasing}
        />
      )}
    </div>
  );
};

const RELEASE_MARKER = '\n— Released: ';
const RELEASE_ONLY = 'Released: ';

/**
 * `note` carries two authors: what the broker typed when placing the hold,
 * and — once released — the estate's reason appended underneath.
 *
 * Split so they are not run together inside one pair of quotation marks. The
 * card quotes the note as the broker's words, and a newline collapses in
 * HTML, so appending without this renders "Ana Ruiz — 40th birthday —
 * Released: test row" as a single sentence the broker appears to have said.
 */
const splitNote = (
  note: string,
): { broker: string | null; release: string | null } => {
  const at = note.lastIndexOf(RELEASE_MARKER);
  if (at !== -1) {
    return {
      broker: note.slice(0, at).trim() || null,
      release: note.slice(at + RELEASE_MARKER.length).trim() || null,
    };
  }
  // Released with a reason but no note of the broker's own.
  return note.startsWith(RELEASE_ONLY)
    ? { broker: null, release: note.slice(RELEASE_ONLY.length).trim() || null }
    : { broker: note, release: null };
};

/** Everything Lodgify asks for, in one clipboard paste. */
const forLodgify = (hold: BrokerHold): string =>
  [
    `${hold.brokerName}${hold.brokerAgency ? ` (${hold.brokerAgency})` : ''}`,
    hold.brokerEmail ?? 'no email recorded',
    `${stayDateWithYear(hold.checkIn)} → ${stayDateWithYear(hold.checkOut)}`,
    `${hold.nights} nights · ${hold.guestCount ?? '?'} guests`,
  ].join('\n');

/**
 * One labelled fact.
 *
 * The label is the point of the layout. A bare "6" beside a bare "$10,000"
 * asks Rodrigo to remember which number is which; "Guests / 6" does not.
 * Missing values say so, rather than leaving a gap that reads as a fault.
 */
const Fact = ({
  label,
  children,
  missing,
  span,
  wrap,
}: {
  label: string;
  children: React.ReactNode;
  missing?: boolean;
  /** Columns to occupy once the grid opens up. */
  span?: string;
  /** Let a long value run onto a second line instead of being cut off. */
  wrap?: boolean;
}) => (
  <div className={cn('min-w-0', span)}>
    <span className="block text-[9.5px] font-medium uppercase tracking-[0.1em] text-manager-text-muted">
      {label}
    </span>
    <span
      className={cn(
        'mt-1 block text-[13.5px] tabular-nums',
        // Truncating is right for an address — it is a link, and the whole of
        // it is in the href. It is wrong for the dates, which are the reason
        // anyone opened this card: "13 Sept — Sat, 19 Sept 2…" answers nothing.
        wrap ? 'leading-snug' : 'truncate',
        missing ? 'text-manager-text-muted' : 'text-manager-text',
      )}
    >
      {children}
    </span>
  </div>
);

/**
 * The broker's words, and the estate's.
 *
 * Given different keys deliberately — one italic and quoted behind a neutral
 * rule, the other upright and labelled behind an amber one. They share a
 * single database column, and without that difference a release reason reads
 * as something the broker said.
 */
const HoldNote = ({ note }: { note: string }) => {
  const { broker, release } = splitNote(note);

  return (
    <div className="space-y-2.5 px-5 pb-4">
      {broker && (
        <p className="border-l-2 border-manager-border pl-3 text-[12.5px] italic leading-relaxed text-manager-text-muted">
          &ldquo;{broker}&rdquo;
        </p>
      )}
      {release && (
        <div className="border-l-2 border-[#e8d5ae] pl-3">
          <span className="block text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#8a6d3b]">
            Released
          </span>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-manager-text">
            {release}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * A hold, as a structured card.
 *
 * The header names the broker and the clock, a grid of labelled facts carries
 * everything needed to make the Lodgify booking, and the actions sit together
 * in a footer. What this replaces ran all four facts down the left as
 * unlabelled prose and stranded Copy for Lodgify in the middle of an
 * otherwise empty row.
 */
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
  const urgent = isUrgent(hold);

  return (
    <div className="overflow-hidden rounded-xl border border-manager-border bg-white">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-manager-border px-5 py-3">
        <p className="text-sm font-semibold text-manager-text">
          {hold.brokerName}
        </p>
        {hold.brokerAgency && (
          <p className="text-[13px] text-manager-text-muted">
            · {hold.brokerAgency}
          </p>
        )}
        <span className="flex-1" />
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            // An hour left is a different fact from thirty. Amber says
            // "decide today"; red says "decide now, or it decides itself".
            urgent
              ? 'border-[#f1c7be] bg-[#fdf3f1] text-[#b42318]'
              : STATUS_STYLES[hold.status],
          )}
        >
          {countdown(hold)}
        </span>
      </div>

      {/* Six columns rather than four, split 2/1/1/2. An equal split gave the
          date range the same width as a single digit, and it was the one fact
          on the card that got cut off. */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-4 px-5 py-4 lg:grid-cols-6">
        <Fact label="Dates" span="lg:col-span-2" wrap>
          {stayDate(hold.checkIn)} — {stayDateLong(hold.checkOut)}
          <span className="text-manager-text-muted">
            {' '}
            · {hold.nights} nights
          </span>
        </Fact>

        <Fact label="Guests" missing={hold.guestCount == null}>
          {hold.guestCount ?? 'Not recorded'}
        </Fact>

        <Fact label="Estimate" missing={hold.estimatedTotal == null}>
          {hold.estimatedTotal == null ? (
            'Not priced'
          ) : (
            <>
              {formatPrice(Number(hold.estimatedTotal))}
              {hold.estimateSource !== 'lodgify' && (
                <span className="text-manager-text-muted"> · indicative</span>
              )}
            </>
          )}
        </Fact>

        <Fact label="Email" missing={!hold.brokerEmail} span="lg:col-span-2">
          {hold.brokerEmail ? (
            <a
              href={`mailto:${hold.brokerEmail}`}
              className="underline decoration-manager-border underline-offset-2 hover:decoration-current"
            >
              {hold.brokerEmail}
            </a>
          ) : (
            'Not recorded'
          )}
        </Fact>
      </div>

      {hold.note && <HoldNote note={hold.note} />}

      <div className="flex flex-wrap items-center gap-2 border-t border-manager-border bg-manager-main px-5 py-3">
        {/* Retyping four fields into another tab is where transcription errors
            come from — and a wrong email on a booking is one nobody notices
            until the guest doesn't reply. Quiet and to the left: it is a
            convenience, not a decision. */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(forLodgify(hold));
            toast.success('Copied — paste into Lodgify');
          }}
          className="text-manager-text-muted hover:text-manager-text"
        >
          <Copy className="mr-1.5 size-3.5" />
          Copy for Lodgify
        </Button>

        <span className="flex-1" />

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

        {onRelease && (
          <Button
            type="button"
            variant="outline"
            onClick={onRelease}
            disabled={busy}
            className="border-manager-border bg-white text-manager-text"
          >
            <CalendarX className="mr-1.5 size-3.5" />
            Release
          </Button>
        )}

        {pending && onConfirm && (
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
        )}
      </div>
    </div>
  );
};
