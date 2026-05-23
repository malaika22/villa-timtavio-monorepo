import Link from 'next/link';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';

import { ReportsVendorRating } from '@/components/manager/pages/reports/ReportsVendorRating';
import { reportsTopVendors } from '@/lib/reports-mock-data';
import type { ReportsTopVendorRow } from '@/lib/reports-mock-data';

export const ReportsTopVendorsTable = () => {
  const columns: DataTableColumn<ReportsTopVendorRow>[] = [
    {
      key: 'vendor',
      header: 'Vendor',
      cell: (row) => (
        <span className="font-inter text-sm font-semibold text-manager-text">{row.vendor}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => <span className="font-inter text-sm text-manager-text-muted">{row.category}</span>,
    },
    {
      key: 'bookings',
      header: 'Bookings',
      cell: (row) => (
        <span className="font-inter text-sm tabular-nums text-manager-text">{row.bookings}</span>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      cell: (row) => (
        <span className="font-inter text-sm font-medium tabular-nums text-manager-text">
          {row.revenue}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Avg Rating',
      cell: (row) => <ReportsVendorRating rating={row.rating} />,
    },
    {
      key: 'lastBooking',
      header: 'Last Booking',
      cell: (row) => (
        <span className="font-inter text-sm text-manager-text-muted">{row.lastBooking}</span>
      ),
    },
  ];

  return (
    <section className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-cormorant shrink-0 text-[22px] leading-tight text-manager-text">
          Top Vendors by Revenue — March 2026
        </h3>
        <Link
          href="/vendors"
          className="font-inter text-sm font-medium text-manager-accent hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white shadow-[0_1px_3px_rgba(26,22,20,0.06)]">
        <DataTable
          columns={columns}
          rows={reportsTopVendors}
          variant="manager"
          striped={false}
          embedded
          gridLines
        />
      </div>
    </section>
  );
};
