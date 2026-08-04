'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';

import type { GuestWithBookings } from '@repo/api-types';

type Mode = 'upcoming' | 'manifest-review';

const fmt = (d?: string | null) => {
  if (!d) return '—';
  try {
    return format(parseISO(d), 'MMM d, yyyy');
  } catch {
    return d;
  }
};

export const BookingsListTab = ({
  guests,
  isLoading,
  mode,
  onOpenBooking,
}: {
  guests: GuestWithBookings[];
  isLoading: boolean;
  mode: Mode;
  /** Manifest review only — open that booking's stay view. */
  onOpenBooking?: (bookingId: string) => void;
}) => {
  // Flatten to (guest, booking) rows; manifest-review keeps only SUBMITTED.
  const rows = guests.flatMap((g) =>
    g.primaryBookings
      .filter((b) =>
        mode === 'manifest-review' ? b.manifestStatus === 'SUBMITTED' : true,
      )
      .map((b) => ({ guest: g, booking: b })),
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-manager-border"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-[#ebe6df] bg-white p-8 text-center text-sm text-manager-text-muted">
        {mode === 'manifest-review'
          ? 'No manifests awaiting review.'
          : 'No upcoming bookings.'}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#ebe6df] bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-[#ebe6df] bg-[#faf9f7] text-left text-xs uppercase tracking-wide text-manager-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Guest</th>
            <th className="px-4 py-3 font-medium">Check-in</th>
            <th className="px-4 py-3 font-medium">Check-out</th>
            <th className="px-4 py-3 font-medium">Nights</th>
            <th className="px-4 py-3 font-medium">Party</th>
            <th className="px-4 py-3 font-medium">
              {mode === 'manifest-review' ? 'Manifest' : 'Status'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ guest, booking }) => (
            <tr
              key={booking.id}
              className="border-b border-[#f1ece4] last:border-0 hover:bg-[#faf9f7]"
            >
              <td className="px-4 py-3">
                {/* This linked to the tab you were already on, so a submitted
                    manifest could be seen and never opened — and approving it
                    is what sends the secondaries their links. It now opens
                    THAT booking. */}
                {mode === 'manifest-review' ? (
                  <button
                    type="button"
                    onClick={() => onOpenBooking?.(booking.id)}
                    className="font-medium text-manager-text hover:underline"
                  >
                    {guest.firstName} {guest.lastName}
                  </button>
                ) : (
                  <Link
                    href={`/guests?guest=${guest.id}`}
                    className="font-medium text-manager-text hover:underline"
                  >
                    {guest.firstName} {guest.lastName}
                  </Link>
                )}
              </td>
              <td className="px-4 py-3 text-manager-text-muted">
                {fmt(booking.checkIn)}
              </td>
              <td className="px-4 py-3 text-manager-text-muted">
                {fmt(booking.checkOut)}
              </td>
              <td className="px-4 py-3 text-manager-text-muted">
                {booking.nights}
              </td>
              <td className="px-4 py-3 text-manager-text-muted">
                {booking.totalGuests}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-[#f5ebe0] px-2.5 py-1 text-xs font-medium text-[#8b6914]">
                  {mode === 'manifest-review'
                    ? booking.manifestStatus
                    : booking.status.replace(/_/g, ' ')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
