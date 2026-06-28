'use client';

import { useState } from 'react';
import { Input } from '@repo/ui';
import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { AuditLogEntry } from '@repo/api-types';

import { useAuditLog } from '@/hooks/useAudit';

const prettyAction = (a: string) =>
  a
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const AuditLogPage = () => {
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading } = useAuditLog({ search: search || undefined });

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: 'Date / Time',
      cell: (row) => {
        let when = row.createdAt;
        try {
          when = format(parseISO(row.createdAt), 'MMM d, yyyy · h:mm a');
        } catch {
          /* keep raw */
        }
        return (
          <span className="whitespace-nowrap text-sm text-manager-text-muted">
            {when}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <span className="inline-flex rounded-full bg-manager-main px-2.5 py-1 text-xs font-medium text-manager-text">
          {prettyAction(row.action)}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      cell: (row) => (
        <div className="min-w-[160px]">
          <p className="text-sm text-manager-text">{row.entityType}</p>
          <p className="truncate text-xs text-manager-text-muted">{row.entityId}</p>
        </div>
      ),
    },
    {
      key: 'performedBy',
      header: 'Performed by',
      cell: (row) => (
        <div>
          <p className="text-sm text-manager-text">{row.performedBy}</p>
          <p className="text-xs text-manager-text-muted">{row.performedByRole}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a8a29e]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user, entity…"
          className="h-10 rounded-lg border-manager-border bg-manager-card pl-9 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-manager-border" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-manager-border bg-manager-card px-4 py-10 text-center text-sm text-manager-text-muted">
          No audit entries{search ? ' match your search' : ' yet'}.
        </p>
      ) : (
        <DataTable columns={columns} rows={rows} variant="manager" striped={false} />
      )}
    </div>
  );
};
