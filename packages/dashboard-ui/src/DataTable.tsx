import { Fragment, type ReactNode } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { getDashboardTokens, type DashboardVariant } from './dashboard-tokens';
import { DashboardCard } from './DashboardCard';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

/**
 * A banded run of rows under a full-width header — for tables where the rows
 * belong to something (a stay, a vendor) and reading them apart from it loses
 * the point. Collapsing is the caller's business: pass `collapsed` and render
 * whatever control belongs in `header`.
 */
export type DataTableGroup<T> = {
  key: string;
  header: ReactNode;
  rows: T[];
  collapsed?: boolean;
};

export const DataTable = <T extends { id: string }>({
  columns,
  rows,
  groups,
  variant = 'intel',
  striped = true,
  embedded = false,
  gridLines = false,
  emptyState,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** When present, rows are rendered under group bands and `rows` is ignored. */
  groups?: DataTableGroup<T>[];
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

  const isEmpty = groups ? groups.length === 0 : rows.length === 0;

  const renderRow = (row: T, i: number) => (
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
  );

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
          {isEmpty ? (
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
          {groups
            ? groups.map((group) => (
                <Fragment key={group.key}>
                  <tr className={cn('border-b', rowBorder)}>
                    <td colSpan={columns.length} className="p-0">
                      {group.header}
                    </td>
                  </tr>
                  {group.collapsed ? null : group.rows.map(renderRow)}
                </Fragment>
              ))
            : rows.map(renderRow)}
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
