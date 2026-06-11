'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { Button } from '@repo/ui';

import { useInquiries } from '@/hooks/useInquiries';
import type { Inquiry } from '@repo/api-types';
import { formatDate } from '@/helpers/dateFormat';
import { getNameInitials } from '@/helpers/getNameInitials';
import { PURPOSE_LABEL, STATUS_PILL } from './constants';

export const InquiriesPage = () => {
  const { data: inquiries, isLoading, error } = useInquiries();

  const columns: DataTableColumn<Inquiry>[] = [
    {
      key: 'guest',
      header: 'Inquiry',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-manager-accent/10 text-sm font-semibold text-manager-accent">
            {getNameInitials(row.firstName, row.lastName)}
          </div>
          <div>
            <p className="font-semibold text-manager-text">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-sm text-manager-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">
          {row.preferredFrom ? (
            <>
              {formatDate(row.preferredFrom)} – {formatDate(row.preferredTo)}
            </>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      key: 'guests',
      header: 'Guests',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">
          {row.guestCount ?? '—'}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">
          {row.purposeOfStay
            ? (PURPOSE_LABEL[row.purposeOfStay] ?? row.purposeOfStay)
            : '—'}
        </span>
      ),
    },
    {
      key: 'received',
      header: 'Received',
      cell: (row) => (
        <span className="text-sm text-manager-text-muted">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const pill = STATUS_PILL[row.status];
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pill.classes}`}
          >
            {pill.label}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: '',
      cell: (row) => (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-9 rounded-md border-manager-border bg-manager-card px-4 text-sm font-medium text-manager-text shadow-none hover:bg-manager-main"
        >
          <Link href={`/inquiries/${row.id}`}>Review →</Link>
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-manager-border"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-manager-border bg-manager-card p-8 text-center">
        <p className="text-sm text-red-500">
          Failed to load inquiries. Please refresh.
        </p>
      </div>
    );
  }

  if (!inquiries || inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-manager-border bg-manager-card py-16 text-center">
        <MessageSquare className="mb-3 size-8 text-manager-text-muted/40" />
        <p className="text-sm font-medium text-manager-text">
          No inquiries yet
        </p>
        <p className="mt-1 text-sm text-manager-text-muted">
          New inquiries will appear here.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={inquiries}
      variant="manager"
      striped={false}
    />
  );
};
