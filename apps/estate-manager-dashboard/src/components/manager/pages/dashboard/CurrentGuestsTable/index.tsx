'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import type { BookingStatus } from '@repo/api-types';

import { SectionLinkHeader } from '@/components/manager/ui/SectionLinkHeader';
import { SectionEmptyState } from '@/components/manager/ui/SectionEmptyState';
import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { GuestStatusDot } from '@/components/manager/ui/GuestStatusDot';
import { emBookingsApi } from '@/lib/api/bookings';
import type { CurrentGuest } from '@/types';
import { STATUS_CYCLE } from './constants';
import { mapBookingStatusToGuestStatus } from './helpers';

const BookingStatusPill = ({
  guest,
  onStatusChange,
}: {
  guest: CurrentGuest;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
}) => {
  const nextStatus = () => {
    const idx = STATUS_CYCLE.indexOf(guest.bookingStatus);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]!;
    onStatusChange(guest.bookingId, next);
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        nextStatus();
      }}
      className="cursor-pointer"
      aria-label={`Update status for ${guest.name}`}
    >
      <GuestStatusDot status={guest.status} />
    </button>
  );
};

export const CurrentGuestsTable = ({ guests }: { guests: CurrentGuest[] }) => {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: BookingStatus;
    }) => emBookingsApi.updateStatus(bookingId, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guests', 'current'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleStatusChange = (bookingId: string, status: BookingStatus) => {
    statusMutation.mutate({ bookingId, status });
  };

  const columns: DataTableColumn<CurrentGuest>[] = [
    {
      key: 'guest',
      header: 'Guest',
      cell: (row) => (
        <Link
          href={`/guests?guest=${row.id}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <GuestAvatar initials={row.initials} />
          <div>
            <p className="font-semibold text-manager-text">{row.name}</p>
            <p className="text-sm text-manager-text-muted">
              Party of {row.partySize}
            </p>
          </div>
        </Link>
      ),
    },
    {
      key: 'villa',
      header: 'Villa',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">{row.villa}</span>
      ),
    },
    {
      key: 'checkout',
      header: 'Checkout',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">{row.checkout}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <BookingStatusPill guest={row} onStatusChange={handleStatusChange} />
      ),
    },
  ];

  return (
    <div>
      <SectionLinkHeader
        title="Current Guests"
        href="/guests"
        linkLabel="View all →"
      />
      {guests.length === 0 ? (
        <SectionEmptyState
          message="No current guests"
          description="Guests with active or upcoming stays will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={guests.map((guest) =>
            statusMutation.isPending &&
            statusMutation.variables?.bookingId === guest.bookingId
              ? {
                  ...guest,
                  status: mapBookingStatusToGuestStatus(
                    statusMutation.variables.status,
                  ),
                  bookingStatus: statusMutation.variables.status,
                }
              : guest,
          )}
          variant="manager"
          striped={false}
        />
      )}
    </div>
  );
};
