'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { StayStatusBadge } from '@/components/intelligence/tables/StayStatusBadge';
import type { UpcomingStay } from '@/types';

export const UpcomingStaysTable = ({ stays }: { stays: UpcomingStay[] }) => (
  <IntelCard padding={false} className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-intel-border px-5 py-3.5">
      <h3 className="text-sm font-medium text-intel-text">Upcoming Stays</h3>
      <a
        href="/analytics"
        className="text-xs text-intel-maroon hover:underline"
      >
        Full analytics →
      </a>
    </div>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-intel-border bg-intel-main/40 hover:bg-intel-main/40">
            {[
              'Guest',
              'Villa(s)',
              'Arrival',
              'Departure',
              'Nights',
              'Party',
              'Source',
              'Est. Revenue',
              'Status',
            ].map((col) => (
              <TableHead
                key={col}
                className="h-10 whitespace-nowrap px-4 text-[10px] font-medium tracking-[0.12em] text-intel-text-muted uppercase"
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stays.map((s) => (
            <TableRow
              key={s.id}
              className="border-intel-border hover:bg-intel-main/30"
            >
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f0ebe6] text-[11px] font-semibold text-intel-maroon">
                    {s.guestInitials}
                  </div>
                  <div className="min-w-[140px]">
                    <p className="text-sm font-medium text-intel-text">
                      {s.guestName}
                    </p>
                    <p className="text-[11px] text-intel-text-muted">
                      {s.guestMeta}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-intel-text">
                {s.villas}
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-intel-text-muted">
                {s.arrival}
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-intel-text-muted">
                {s.departure}
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-intel-text">
                {s.nights}
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-intel-text-muted">
                {s.party} guests
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-intel-text-muted">
                {s.source}
              </TableCell>
              <TableCell className="whitespace-nowrap px-4 py-3 text-sm font-medium text-intel-text">
                {s.estRevenue}
              </TableCell>
              <TableCell className="px-4 py-3">
                <StayStatusBadge status={s.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </IntelCard>
);
