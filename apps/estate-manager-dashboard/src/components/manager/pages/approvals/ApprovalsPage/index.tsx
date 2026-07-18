'use client';

import { useMemo, useState } from 'react';

import { ApprovalsFilterBar } from '@/components/manager/pages/approvals/ApprovalsFilterBar';
import { ApprovalsKanban } from '@/components/manager/pages/approvals/ApprovalsKanban';
import { ApprovalsQueueTable } from '@/components/manager/pages/approvals/ApprovalsQueueTable';
import { LayoutList, LayoutGrid } from 'lucide-react';
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
    // No mock fallback — show nothing until real data loads.
    return [];
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

  const isLoading = queueLoading || activeLoading;
  const [view, setView] = useState<'list' | 'board'>('list');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ApprovalsFilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
        />
        <div className="inline-flex rounded-lg border border-manager-border bg-manager-card p-0.5">
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label="List view"
            className={`flex size-8 items-center justify-center rounded-md ${view === 'list' ? 'bg-manager-accent text-white' : 'text-manager-text-muted'}`}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('board')}
            aria-label="Board view"
            className={`flex size-8 items-center justify-center rounded-md ${view === 'board' ? 'bg-manager-accent text-white' : 'text-manager-text-muted'}`}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-manager-border"
            />
          ))}
        </div>
      ) : view === 'board' ? (
        <ApprovalsKanban rows={filteredRows} />
      ) : (
        <ApprovalsQueueTable rows={filteredRows} />
      )}
    </div>
  );
};
