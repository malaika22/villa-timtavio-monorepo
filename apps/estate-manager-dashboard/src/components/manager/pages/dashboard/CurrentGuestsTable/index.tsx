import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';

import { SectionLinkHeader } from '@/components/manager/ui/SectionLinkHeader';
import { GuestAvatar } from '@/components/manager/ui/GuestAvatar';
import { GuestStatusDot } from '@/components/manager/ui/GuestStatusDot';
import type { CurrentGuest } from '@/types';

export const CurrentGuestsTable = ({ guests }: { guests: CurrentGuest[] }) => {
  const columns: DataTableColumn<CurrentGuest>[] = [
    {
      key: 'guest',
      header: 'Guest',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <GuestAvatar initials={row.initials} />
          <div>
            <p className="font-semibold text-manager-text">{row.name}</p>
            <p className="text-sm text-manager-text-muted">Party of {row.partySize}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'villa',
      header: 'Villa',
      cell: (row) => <span className="text-sm text-manager-text-muted">{row.villa}</span>,
    },
    {
      key: 'checkout',
      header: 'Checkout',
      cell: (row) => <span className="text-sm text-manager-text-muted">{row.checkout}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <GuestStatusDot status={row.status} />,
    },
  ];

  return (
    <div>
      <SectionLinkHeader title="Current Guests" href="/guests" linkLabel="View all →" />
      <DataTable columns={columns} rows={guests} variant="manager" striped={false} />
    </div>
  );
};
