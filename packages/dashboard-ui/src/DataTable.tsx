import type { ReactNode } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { getDashboardTokens, type DashboardVariant } from './dashboard-tokens';
import { DashboardCard } from './DashboardCard';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export const DataTable = <T extends { id: string }>({
  columns,
  rows,
  variant = 'intel',
  striped = true,
  embedded = false,
  gridLines = false,
  emptyState,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  variant?: DashboardVariant;
  striped?: boolean;
  /** No outer DashboardCard — table only (optionally framed by parent) */
  embedded?: boolean;
  gridLines?: boolean;
  /** Shown in place of rows when there are none. Falls back to a generic line. */
  emptyState?: ReactNode;
}) => {
  const t = getDashboardTokens(variant);
  const isManager = variant === 'manager';
  const gridBorder = 'border-r border-[#ebe6df] last:border-r-0';
  const cellBorder = gridLines
    ? gridBorder
    : isManager
      ? ''
      : cn('border-r', t.border, 'last:border-r-0');
  const headerBg = gridLines ? 'bg-[#f4f1eb]' : 'bg-[#f7f5f2]';
  const rowBorder = gridLines ? 'border-[#ebe6df]' : t.border;

  const table = (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className={cn('border-b', rowBorder, headerBg)}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-5 py-3 text-left text-[10px] font-medium tracking-[0.12em] uppercase',
                  t.textMuted,
                  cellBorder,
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={cn(
                  'px-5 py-14 text-center text-sm',
                  t.textMuted,
                )}
              >
                {emptyState ?? 'Nothing to show yet.'}
              </td>
            </tr>
          ) : null}
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={cn(
                'border-b last:border-b-0',
                rowBorder,
                gridLines ? 'bg-white' : striped && i % 2 === 1 && 'bg-[#faf9f7]',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-5 py-4 align-middle',
                    isManager && !gridLines && 'text-[15px] text-manager-text',
                    cellBorder,
                    col.className,
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (embedded) return table;

  return (
    <DashboardCard variant={variant} padding={false} className="overflow-hidden rounded-xl">
      {table}
    </DashboardCard>
  );
};
