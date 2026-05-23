'use client';

import { useMemo, useState } from 'react';

import { ApprovalsFilterBar } from '@/components/manager/pages/approvals/ApprovalsFilterBar';
import { ApprovalsQueueTable } from '@/components/manager/pages/approvals/ApprovalsQueueTable';
import { ConflictDetectedBanner } from '@/components/manager/pages/approvals/ConflictDetectedBanner';
import {
  approvalQueueItems,
  conflictDetectedMessage,
} from '@/lib/approvals-mock-data';
import type { ApprovalFilterTab, ApprovalQueueItem } from '@/types';

function filterByTab(items: ApprovalQueueItem[], tab: ApprovalFilterTab): ApprovalQueueItem[] {
  switch (tab) {
    case 'pending':
      return items.filter((i) => i.status === 'Pending');
    case 'confirmed':
      return items.filter((i) => i.status === 'Confirmed');
    case 'in-progress':
      return items.filter((i) => i.status === 'In Progress');
    case 'completed':
      return items.filter((i) => i.status === 'Completed');
    case 'declined':
      return items.filter((i) => i.status === 'Declined');
    default:
      return items;
  }
}

function filterBySearch(items: ApprovalQueueItem[], query: string): ApprovalQueueItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.guestName.toLowerCase().includes(q) ||
      i.experience.toLowerCase().includes(q) ||
      i.villa.toLowerCase().includes(q) ||
      i.vendor.toLowerCase().includes(q),
  );
}

export const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<ApprovalFilterTab>('all');
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    const byTab = filterByTab(approvalQueueItems, activeTab);
    return filterBySearch(byTab, search);
  }, [activeTab, search]);

  const hasConflict = approvalQueueItems.some((i) => i.status === 'Conflict');

  return (
    <div className="space-y-5">
      <ApprovalsFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
      />

      {hasConflict ? <ConflictDetectedBanner message={conflictDetectedMessage} /> : null}

      <ApprovalsQueueTable rows={filteredRows} />
    </div>
  );
};
