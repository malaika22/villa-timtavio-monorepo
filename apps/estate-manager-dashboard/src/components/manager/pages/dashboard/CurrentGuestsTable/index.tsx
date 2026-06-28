'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Check } from 'lucide-react';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import type { BookingStatus } from '@repo/api-types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';

import { SectionLinkHeader } from '@/components/manager/ui/SectionLinkHeader';
import { SectionEmptyState } from '@/components/manager/ui/SectionEmptyState';
import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { GuestStatusDot } from '@/components/manager/ui/GuestStatusDot';
import { emBookingsApi } from '@/lib/api/bookings';
import type { CurrentGuest } from '@/types';
import { STATUS_CYCLE, STATUS_LABELS } from './constants';
import { mapBookingStatusToGuestStatus } from './helpers';

const BookingStatusPill = ({
  guest,
  onStatusChange,
}: {
  guest: CurrentGuest;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full transition-opacity hover:opacity-80"
        aria-label={`Change status for ${guest.name}`}
      >
        <GuestStatusDot status={guest.status} />
        <ChevronDown className="size-3.5 text-manager-text-muted" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44">
      <DropdownMenuLabel className="text-xs text-manager-text-muted">
        Set status
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {STATUS_CYCLE.map((status) => {
        const isCurrent = status === guest.bookingStatus;
        return (
          <DropdownMenuItem
            key={status}
            onSelect={(event) => {
              event.preventDefault();
              if (!isCurrent) onStatusChange(guest.bookingId, status);
            }}
            className={cn(
              'flex items-center justify-between gap-2 text-sm',
              isCurrent && 'font-semibold text-manager-text',
            )}
          >
            {STATUS_LABELS[status]}
            {isCurrent ? <Check className="size-3.5 shrink-0" /> : null}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuContent>
  </DropdownMenu>
);

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
