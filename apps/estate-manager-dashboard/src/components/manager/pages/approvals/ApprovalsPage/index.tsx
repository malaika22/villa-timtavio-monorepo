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
import { useApprovalQueue, useApprovalActive } from '@/hooks/useApprovals';
import { mapRequestToApprovalItem } from '@/lib/mappers/request';
import { filterBySearch, filterByTab } from './helpers';

export const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<ApprovalFilterTab>('all');
  const [search, setSearch] = useState('');

  const { data: queueData, isLoading: queueLoading } = useApprovalQueue();
  const { data: activeData, isLoading: activeLoading } = useApprovalActive();

  const allItems: ApprovalQueueItem[] = useMemo(() => {
    if (queueData && activeData) {
      const queueItems = queueData.map(mapRequestToApprovalItem);
      const activeItems = activeData.map(mapRequestToApprovalItem);
      // Deduplicate by id
      const seen = new Set<string>();
      return [...queueItems, ...activeItems].filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
    }
    return approvalQueueItems;
  }, [queueData, activeData]);

  const filteredRows = useMemo(() => {
    const byTab = filterByTab(allItems, activeTab);
    return filterBySearch(byTab, search);
  }, [allItems, activeTab, search]);

  const hasConflict = allItems.some((i) => i.status === 'Conflict');
  const isLoading = queueLoading || activeLoading;

  return (
    <div className="space-y-5">
      <ApprovalsFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
      />

      {hasConflict ? (
        <ConflictDetectedBanner message={conflictDetectedMessage} />
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-manager-border"
            />
          ))}
        </div>
      ) : (
        <ApprovalsQueueTable rows={filteredRows} />
      )}
    </div>
  );
};
