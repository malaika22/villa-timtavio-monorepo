'use client';

import { Search } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@repo/ui';

import type { ApprovalFilterTab, ApprovalHorizon } from '@/types';

const TABS: { value: ApprovalFilterTab; label: string }[] = [
  { value: 'all', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
];

/**
 * The only filter that bounds the page. Requests now arrive months ahead, so
 * without a horizon the queue is every experience the estate has ever been
 * asked for — defaults to everything still to come.
 */
const HORIZONS: { value: ApprovalHorizon; label: string }[] = [
  { value: 'week', label: 'Next 7 days' },
  { value: 'month', label: 'Next 30 days' },
  { value: 'upcoming', label: 'All upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'Everything' },
];

type Props = {
  activeTab: ApprovalFilterTab;
  onTabChange: (tab: ApprovalFilterTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  counts?: Partial<Record<ApprovalFilterTab, number>>;
  horizon: ApprovalHorizon;
  onHorizonChange: (horizon: ApprovalHorizon) => void;
};

export const ApprovalsFilterBar = ({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  counts = {},
  horizon,
  onHorizonChange,
}: Props) => {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-3">
      <div className="inline-flex w-full max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-manager-border bg-manager-card p-1 shadow-none xl:w-auto xl:flex-nowrap">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const count = counts[tab.value];
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-manager-accent text-white'
                  : 'text-[#8a8178] hover:text-manager-text',
              )}
            >
              {tab.label}
              {count != null && count > 0 ? (
                <span
                  className={cn(
                    'flex size-6 min-w-6 items-center justify-center rounded-full text-sm font-semibold leading-none',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-[#f5ebe0] text-[#8b6914]',
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex w-full items-center gap-2 xl:ml-auto xl:w-auto">
        <div className="relative min-w-0 flex-1 xl:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#a8a29e]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="h-10 w-full rounded-lg border-manager-border bg-manager-card pl-9 text-sm text-manager-text shadow-none placeholder:text-[#a8a29e]"
          />
        </div>
        <select
          value={horizon}
          onChange={(e) => onHorizonChange(e.target.value as ApprovalHorizon)}
          aria-label="Time range"
          className="h-10 shrink-0 rounded-lg border border-manager-border bg-manager-card px-3 text-sm text-manager-text shadow-none"
        >
          {HORIZONS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
