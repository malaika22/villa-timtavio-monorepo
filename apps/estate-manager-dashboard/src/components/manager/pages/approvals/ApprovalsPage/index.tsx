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
import {
  useApprovalQueue,
  useApprovalActive,
  useApprovalHistory,
} from '@/hooks/useApprovals';
import { mapRequestToApprovalItem } from '@/lib/mappers/request';
import { filterBySearch, filterByTab } from './helpers';

export const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<ApprovalFilterTab>('all');
  const [search, setSearch] = useState('');

  const { data: queueData, isLoading: queueLoading } = useApprovalQueue();
  const { data: activeData, isLoading: activeLoading } = useApprovalActive();
  const { data: historyData } = useApprovalHistory();

  const allItems: ApprovalQueueItem[] = useMemo(() => {
    if (queueData && activeData) {
      const queueItems = queueData.map(mapRequestToApprovalItem);
      const activeItems = activeData.map(mapRequestToApprovalItem);
      const historyItems = (historyData ?? []).map(mapRequestToApprovalItem);
      // Deduplicate by id
      const seen = new Set<string>();
      return [...queueItems, ...activeItems, ...historyItems].filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
    }
    return approvalQueueItems;
  }, [queueData, activeData, historyData]);

  const filteredRows = useMemo(() => {
    const byTab = filterByTab(allItems, activeTab);
    return filterBySearch(byTab, search);
  }, [allItems, activeTab, search]);

  const counts = useMemo(
    () => ({
      all: allItems.length,
      pending: filterByTab(allItems, 'pending').length,
      confirmed: filterByTab(allItems, 'confirmed').length,
      'in-progress': filterByTab(allItems, 'in-progress').length,
      completed: filterByTab(allItems, 'completed').length,
      declined: filterByTab(allItems, 'declined').length,
    }),
    [allItems],
  );

  const hasConflict = allItems.some((i) => i.status === 'Conflict');
  const isLoading = queueLoading || activeLoading;

  return (
    <div className="space-y-5">
      <ApprovalsFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        counts={counts}
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
