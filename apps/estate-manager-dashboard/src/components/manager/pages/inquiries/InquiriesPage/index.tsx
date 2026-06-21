'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

import { DataTable } from '@repo/dashboard-ui';
import type { DataTableColumn } from '@repo/dashboard-ui';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';

import { InquiryDeleteButton } from '@/components/manager/pages/inquiries/InquiryDeleteButton';
import { useInquiries } from '@/hooks/useInquiries';
import type { Inquiry, InquiryStatus } from '@repo/api-types';
import { formatDate } from '@/helpers/dateFormat';
import { getNameInitials } from '@/helpers/getNameInitials';
import { PURPOSE_LABEL, STATUS_PILL } from './constants';

const FILTER_TABS: { value: 'all' | InquiryStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'DECLINED', label: 'Declined' },
];

export const InquiriesPage = () => {
  const [filter, setFilter] = useState<'all' | InquiryStatus>('all');
  const statusParam = filter === 'all' ? undefined : filter;
  const { data: inquiries, isLoading, error } = useInquiries(statusParam);

  const counts = useMemo(() => {
    const all = inquiries ?? [];
    return {
      all: all.length,
      NEW: all.filter((item) => item.status === 'NEW').length,
    };
  }, [inquiries]);

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
        <div className="flex items-center justify-end gap-1">
          <InquiryDeleteButton
            inquiryId={row.id}
            guestName={`${row.firstName} ${row.lastName}`}
            guestEmail={row.email}
            status={row.status}
            variant="list"
          />
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 rounded-md border-manager-border bg-manager-card px-4 text-sm font-medium text-manager-text shadow-none hover:bg-manager-main"
          >
            <Link href={`/inquiries/${row.id}`}>Review →</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.value;
          const count =
            tab.value === 'NEW' && filter === 'all'
              ? counts.NEW
              : undefined;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-manager-accent text-white'
                  : 'border border-manager-border bg-white text-manager-text-muted hover:text-manager-text',
              )}
            >
              {tab.label}
              {count != null && count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-manager-border"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-manager-border bg-manager-card p-8 text-center">
          <p className="text-sm text-red-500">
            Failed to load inquiries. Please refresh.
          </p>
        </div>
      ) : !inquiries || inquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-manager-border bg-manager-card py-16 text-center">
          <MessageSquare className="mb-3 size-8 text-manager-text-muted/40" />
          <p className="text-sm font-medium text-manager-text">
            No inquiries in this view
          </p>
          <p className="mt-1 text-sm text-manager-text-muted">
            New inquiries from the teaser site will appear here in real time.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={inquiries}
          variant="manager"
          striped={false}
        />
      )}
    </div>
  );
};
