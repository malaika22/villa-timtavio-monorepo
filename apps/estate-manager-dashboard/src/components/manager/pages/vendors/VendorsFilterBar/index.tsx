'use client';

import { Search } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@repo/ui';

import type { VendorFilterTab } from '@/types';

const TABS: { value: VendorFilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'culinary', label: 'Culinary' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'water-sports', label: 'Water Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'transport', label: 'Transport' },
];

type Props = {
  activeTab: VendorFilterTab;
  onTabChange: (tab: VendorFilterTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export const VendorsFilterBar = ({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
}: Props) => (
  <div className="font-inter flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="inline-flex w-full max-w-full flex-wrap items-center gap-0.5 rounded-lg border border-manager-border bg-manager-card p-1 shadow-none lg:w-auto lg:flex-nowrap">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'inline-flex shrink-0 items-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#7b5050] text-white'
                : 'text-[#707070] hover:text-manager-text',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>

    <div className="relative w-full shrink-0 lg:w-64">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#a8a29e]" />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search vendors..."
        className="h-10 w-full rounded-lg border-manager-border bg-manager-card pl-9 font-inter text-sm text-manager-text shadow-none placeholder:text-[#a8a29e]"
      />
    </div>
  </div>
);
