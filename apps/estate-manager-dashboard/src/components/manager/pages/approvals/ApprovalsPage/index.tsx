'use client';

import { useMemo, useState } from 'react';

import { ApprovalsFilterBar } from '@/components/manager/pages/approvals/ApprovalsFilterBar';
import { ApprovalsKanban } from '@/components/manager/pages/approvals/ApprovalsKanban';
import { ApprovalsQueueTable } from '@/components/manager/pages/approvals/ApprovalsQueueTable';
import { CancellationRequestsPanel } from '@/components/manager/pages/approvals/CancellationRequestsPanel';
import { ConflictDetectedBanner } from '@/components/manager/pages/approvals/ConflictDetectedBanner';
import { NeedsPricingPanel } from '@/components/manager/pages/approvals/NeedsPricingPanel';
import { LayoutList, LayoutGrid } from 'lucide-react';
import type {
  ApprovalFilterTab,
  ApprovalHorizon,
  ApprovalQueueItem,
} from '@/types';
import {
  useApprovalQueue,
  useApprovalActive,
  useApprovalHistory,
} from '@/hooks/useApprovals';
import { mapRequestToApprovalItem } from '@/lib/mappers/request';
import {
  filterByHorizon,
  filterBySearch,
  filterByTab,
  groupByStay,
} from './helpers';

export const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<ApprovalFilterTab>('all');
  const [search, setSearch] = useState('');
  // Everything still to come. A planning tool that opens on history would be
  // showing the one thing nobody has to act on.
  const [horizon, setHorizon] = useState<ApprovalHorizon>('upcoming');

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

  // Horizon first: it's the only filter that bounds the set, so everything
  // downstream — including the counts — is scoped to the period being worked on.
  const inHorizon = useMemo(
    () => filterByHorizon(allItems, horizon),
    [allItems, horizon],
  );

  const filteredRows = useMemo(() => {
    const byTab = filterByTab(inHorizon, activeTab);
    return filterBySearch(byTab, search);
  }, [inHorizon, activeTab, search]);

  const stayGroups = useMemo(() => groupByStay(filteredRows), [filteredRows]);

  const counts = useMemo(
    () => ({
      all: inHorizon.length,
      pending: filterByTab(inHorizon, 'pending').length,
      confirmed: filterByTab(inHorizon, 'confirmed').length,
      'in-progress': filterByTab(inHorizon, 'in-progress').length,
      completed: filterByTab(inHorizon, 'completed').length,
      declined: filterByTab(inHorizon, 'declined').length,
    }),
    [inHorizon],
  );

  const isLoading = queueLoading || activeLoading;
  const [view, setView] = useState<'list' | 'board'>('list');

  // Conflicts are read from the unfiltered set on purpose: a double-booking is
  // still a double-booking when the horizon happens to be hiding it.
  const conflictItems = useMemo(
    () => allItems.filter((i) => i.status === 'Conflict'),
    [allItems],
  );
  const conflictMessage =
    conflictItems.length === 1
      ? (conflictItems[0]!.conflictReason ??
        `${conflictItems[0]!.experience} clashes with another confirmed experience.`)
      : `${conflictItems.length} experience requests need rescheduling — a vendor or resource is double-booked. Reschedule or decline to resolve.`;

  return (
    <div className="space-y-5">
      {/* Above the queue: a supplier is already booked and the date is coming,
          which makes these more time-sensitive than a new request. */}
      <CancellationRequestsPanel />

      {/* Then what must be priced before it happens. Both are worklists driven
          by the experience date, which submission order can't express. */}
      <NeedsPricingPanel />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ApprovalsFilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          search={search}
          onSearchChange={setSearch}
          counts={counts}
          horizon={horizon}
          onHorizonChange={setHorizon}
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

      {!isLoading && conflictItems.length > 0 && (
        <ConflictDetectedBanner message={conflictMessage} />
      )}

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
        <ApprovalsQueueTable rows={filteredRows} stayGroups={stayGroups} />
      )}
    </div>
  );
};
