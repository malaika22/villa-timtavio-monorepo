'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { BookMarked, Send } from 'lucide-react';
import { Button } from '@repo/ui';

import { useSendMagicLink } from '@/hooks/useMagicLink';
import type { InquiryDetail } from '@repo/api-types';

type Props = {
  inquiry: InquiryDetail;
};

export function InquiryConvertedPanel({ inquiry }: Props) {
  const sendMagicLink = useSendMagicLink();
  const booking = inquiry.linkedBooking;

  if (!booking) {
    return (
      <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-6">
        <h2 className="text-sm font-semibold text-purple-900">
          Booking linked
        </h2>
        <p className="mt-1 text-sm text-purple-800/80">
          This inquiry was converted to booking{' '}
          <span className="font-mono text-xs">{inquiry.convertedToBookingId}</span>
          . Open Bookings + Manifest to manage the stay.
        </p>
        <Button asChild className="mt-4 bg-manager-accent text-white hover:opacity-90">
          <Link href="/bookings">
            <BookMarked className="mr-2 size-4" />
            Open bookings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-purple-200 bg-purple-50/60 p-6">
      <div>
        <h2 className="text-sm font-semibold text-purple-900">
          Converted to booking
        </h2>
        <p className="mt-1 text-sm text-purple-800/80">
          Lodgify reservation synced. Send the guest magic link manually if needed
          before the 24-hour auto-send window.
        </p>
      </div>

      <div className="rounded-lg border border-purple-200 bg-white p-4 text-sm">
        <p className="font-medium text-manager-text">
          {booking.primaryGuest.firstName} {booking.primaryGuest.lastName}
        </p>
        <p className="text-manager-text-muted">{booking.primaryGuest.email}</p>
        <p className="mt-2 text-manager-text-muted">
          {format(parseISO(booking.checkIn), 'MMM d')} –{' '}
          {format(parseISO(booking.checkOut), 'MMM d, yyyy')} ·{' '}
          {booking.totalGuests} guests · Lodgify #{booking.lodgifyId}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => sendMagicLink.mutate(booking.id)}
          disabled={sendMagicLink.isPending}
          className="flex-1 bg-manager-accent text-white hover:opacity-90"
        >
          <Send className="mr-2 size-4" />
          {sendMagicLink.isPending ? 'Sending…' : 'Send magic link to guest'}
        </Button>
        <Button
          asChild
          variant="outline"
          className="flex-1 border-purple-300 bg-white"
        >
          <Link href="/bookings">
            <BookMarked className="mr-2 size-4" />
            View in bookings
          </Link>
        </Button>
      </div>
    </div>
  );
}
