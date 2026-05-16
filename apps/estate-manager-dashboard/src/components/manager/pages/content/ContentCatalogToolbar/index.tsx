'use client';

import { Search } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@repo/ui';

import { contentExperienceFilters } from '@/lib/content-catalog-mock-data';
import type { ContentExperienceCategory } from '@/types';

type FilterValue = 'all' | ContentExperienceCategory;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
  summary: string;
};

export const ContentCatalogToolbar = ({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  summary,
}: Props) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#a8a29e]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search experiences..."
          className="font-inter h-10 w-full rounded-lg border-manager-border bg-white pl-9 text-sm shadow-none placeholder:text-[#a8a29e]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {contentExperienceFilters.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                'font-inter rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-manager-accent text-white'
                  : 'border border-[#e5e0d8] bg-white text-manager-text-muted hover:text-manager-text',
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>

    <p className="font-inter shrink-0 text-sm text-manager-text-muted">{summary}</p>
  </div>
);
