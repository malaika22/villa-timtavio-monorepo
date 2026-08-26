'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui';
import {
  Mail,
  ChevronDown,
  DollarSign,
  LogOut,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BookingStatus } from '@repo/api-types';

import { emBookingsApi } from '@/lib/api/bookings';
import { useSendMagicLink } from '@/hooks/useMagicLink';
import { useCheckout } from '@/hooks/useFolioEM';
import type { GuestDNAProfile } from '@/types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  SETTLED: 'Settled',
  DEPARTURE_TODAY: 'Departing today',
  CHECKED_OUT: 'Checked out',
  CANCELLED: 'Cancelled',
};

const STATUS_CYCLE: BookingStatus[] = [
  'CONFIRMED',
  'CHECKED_IN',
  'SETTLED',
  'DEPARTURE_TODAY',
  'CHECKED_OUT',
];

/**
 * The states in which checking someone out is a real thing to do.
 *
 * It used to be offered unconditionally, so the most prominent button on the
 * screen sat next to a guest arriving in three months and would capture their
 * folio if pressed. Confirmed is excluded on purpose: they have not arrived.
 */
const CHECKOUT_READY: BookingStatus[] = [
  'CHECKED_IN',
  'SETTLED',
  'DEPARTURE_TODAY',
];

const btn =
  'h-8 gap-1.5 rounded-md border-[#e5e0d8] bg-white px-3.5 text-[13px] font-medium text-manager-text shadow-none hover:bg-[#faf9f7]';

export const GuestQuickActions = ({
  profile,
}: {
  profile: GuestDNAProfile;
}) => {
  const queryClient = useQueryClient();
  const bookingId = profile.activeBookingId ?? null;
  const sendLink = useSendMagicLink();
  const checkout = useCheckout(bookingId);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);

  const canCheckout =
    profile.bookingStatus != null &&
    CHECKOUT_READY.includes(profile.bookingStatus);

  const statusMutation = useMutation({
    mutationFn: (status: BookingStatus) =>
      emBookingsApi.updateStatus(bookingId!, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      void queryClient.invalidateQueries({ queryKey: ['guests'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // The Bookings + Manifest surfaces read booking status too — refresh them
      // so the change is reflected without a manual reload.
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['booking', 'current'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!bookingId) {
    return (
      <Button variant="outline" className={btn} disabled>
        No active stay
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Change state */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={btn}
            disabled={statusMutation.isPending}
          >
            {statusMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            {profile.bookingStatus
              ? STATUS_LABELS[profile.bookingStatus]
              : 'Set status'}
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {STATUS_CYCLE.map((s) => {
            const isCurrent = s === profile.bookingStatus;
            return (
              <DropdownMenuItem
                key={s}
                onSelect={(e) => {
                  e.preventDefault();
                  if (!isCurrent) statusMutation.mutate(s);
                }}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className={isCurrent ? 'font-medium' : undefined}>
                  {STATUS_LABELS[s]}
                </span>
                {isCurrent ? (
                  <Check className="size-3.5 text-manager-accent" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Log charge → folio */}
      <Button variant="outline" className={btn} asChild>
        <Link href="/folio">
          <DollarSign className="size-3.5 text-manager-text-muted" />
          Log charge
        </Link>
      </Button>

      {/* Magic link */}
      <Button
        variant="outline"
        className={btn}
        disabled={sendLink.isPending}
        onClick={() => sendLink.mutate(bookingId)}
      >
        {sendLink.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Mail className="size-3.5 text-manager-text-muted" />
        )}
        Magic link
      </Button>

      {/* Checkout */}
      <Button
        className="h-8 gap-1.5 rounded-md border-0 bg-manager-accent px-3.5 text-[13px] font-medium text-white shadow-none hover:bg-manager-accent-muted disabled:opacity-40"
        disabled={checkout.isPending || !canCheckout}
        title={
          canCheckout ? undefined : 'Available once the guest has checked in'
        }
        onClick={() => setConfirmingCheckout(true)}
      >
        {checkout.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <LogOut className="size-3.5" />
        )}
        Checkout
      </Button>

      {/* A native confirm() for an action that captures a folio and closes a
          stay. Same dialog pattern as everywhere else in this dashboard, so
          what is about to happen is named before it happens. */}
      <Dialog open={confirmingCheckout} onOpenChange={setConfirmingCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Check out {profile.name}?
            </DialogTitle>
            <DialogDescription className="text-center">
              This closes the stay and captures the folio
              {profile.stay
                ? ` — ${profile.stay.nights} ${profile.stay.nights === 1 ? 'night' : 'nights'}, party of ${profile.stay.totalGuests}`
                : ''}
              . Charges can no longer be added afterwards.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={checkout.isPending}
              onClick={() => setConfirmingCheckout(false)}
              className="flex-1 border-manager-border"
            >
              Not yet
            </Button>
            <Button
              type="button"
              disabled={checkout.isPending}
              onClick={() =>
                checkout.mutate(undefined, {
                  onSuccess: () => {
                    toast.success('Guest checked out');
                    setConfirmingCheckout(false);
                  },
                  onError: (e) => toast.error((e as Error).message),
                })
              }
              className="flex-1 bg-manager-accent text-white hover:bg-manager-accent-muted"
            >
              {checkout.isPending ? 'Checking out…' : 'Check out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
