'use client';
import { Star } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { ExportMenu } from '@/components/intelligence/ui/ExportMenu';
import { vendorRoiRows } from '@/lib/mock-data';
import type { VendorRoiRow } from '@/types';
import { useVendorsAsRoiRows } from '@/hooks/useVendors';

const COLUMNS = [
  'Vendor',
  'Category',
  'Bookings',
  'Gross Revenue',
  'Vendor Cost',
  'Net Margin',
  'ROI',
  'Rating',
  'Declined',
  'Status',
] as const;

const MUTED_GREY = '#8e8e8e';
const RATING_GOLD = '#c5a070';
const ROI_TAN = '#7b6348';
const DECLINED_HIGH = '#a64b4b';
const DECLINED_LOW = '#6b8e6b';

const cellBorder = 'border-r border-intel-border last:border-r-0';

const declinedColor = (row: VendorRoiRow) =>
  row.declined === 0 || row.declinedPercent < 10 ? DECLINED_LOW : DECLINED_HIGH;

const StatusBadge = ({ status }: { status: VendorRoiRow['status'] }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      status === 'Active'
        ? 'bg-intel-success-bg text-intel-success'
        : 'bg-intel-warning-bg text-intel-warning',
    )}
  >
    <span
      className={cn(
        'size-1.5 rounded-full',
        status === 'Active' ? 'bg-intel-success' : 'bg-intel-warning',
      )}
    />
    {status}
  </span>
);

export const VendorRoiAnalysisTable = () => {
  const { data: apiRows } = useVendorsAsRoiRows();
  const rows: VendorRoiRow[] = apiRows ?? vendorRoiRows;

  const csvRows = rows.map((r) => ({
    Vendor: r.name,
    Category: r.category,
    Bookings: r.bookings,
    'Gross Revenue': r.grossRevenue,
    'Vendor Cost': r.vendorCost,
    'Net Margin': r.netMargin,
    ROI: r.roiLabel,
    Rating: r.rating,
    Status: r.status,
  }));

  return (
  <section>
    <div className="mb-3 flex items-center gap-2">
      <h3 className="font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Vendor ROI Analysis — YTD 2026
      </h3>
      <ExportMenu filename="vendor-roi-analysis" csvRows={csvRows} />
    </div>
    <IntelCard padding={false} className="overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-intel-border bg-[#f9f9f9]">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className={cn(
                    'px-4 py-3 text-left text-[10px] font-medium tracking-[0.12em] text-intel-text-muted uppercase',
                    cellBorder,
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-intel-border last:border-0',
                  i % 2 === 1 && 'bg-[#faf9f7]',
                )}
              >
                <td className={cn('px-4 py-3 font-semibold text-intel-text', cellBorder)}>
                  {row.name}
                </td>
                <td className={cn('px-4 py-3', cellBorder)} style={{ color: MUTED_GREY }}>
                  {row.category}
                </td>
                <td className={cn('px-4 py-3 tabular-nums', cellBorder)} style={{ color: MUTED_GREY }}>
                  {row.bookings}
                </td>
                <td className={cn('px-4 py-3 tabular-nums', cellBorder)} style={{ color: MUTED_GREY }}>
                  {row.grossRevenue}
                </td>
                <td className={cn('px-4 py-3 tabular-nums', cellBorder)} style={{ color: MUTED_GREY }}>
                  {row.vendorCost}
                </td>
                <td className={cn('px-4 py-3 tabular-nums', cellBorder)} style={{ color: MUTED_GREY }}>
                  {row.netMargin}
                </td>
                <td
                  className={cn('px-4 py-3 font-semibold tabular-nums', cellBorder)}
                  style={{ color: ROI_TAN }}
                >
                  {row.roiLabel}
                </td>
                <td className={cn('px-4 py-3', cellBorder)}>
                  <span
                    className="inline-flex items-center gap-1 tabular-nums"
                    style={{ color: RATING_GOLD }}
                  >
                    <Star className="size-3.5" style={{ fill: RATING_GOLD, color: RATING_GOLD }} />
                    {row.rating.toFixed(1)}
                  </span>
                </td>
                <td
                  className={cn('px-4 py-3 font-medium tabular-nums', cellBorder)}
                  style={{ color: declinedColor(row) }}
                >
                  {row.declined === 0 ? '0' : `${row.declined} (${row.declinedPercent}%)`}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IntelCard>
  </section>
  );
};
