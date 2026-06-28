'use client';

import { Filter, Search } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui';
import { Input } from '@repo/ui';

import type { ApprovalFilterTab } from '@/types';

const TABS: { value: ApprovalFilterTab; label: string }[] = [
  { value: 'all', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
];

type Props = {
  activeTab: ApprovalFilterTab;
  onTabChange: (tab: ApprovalFilterTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  counts?: Partial<Record<ApprovalFilterTab, number>>;
};

export const ApprovalsFilterBar = ({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  counts = {},
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
        <Button
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-lg border-manager-border bg-manager-card shadow-none hover:bg-[#faf9f7]"
          aria-label="Filter"
        >
          <Filter className="size-4 text-[#78716c]" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
};
