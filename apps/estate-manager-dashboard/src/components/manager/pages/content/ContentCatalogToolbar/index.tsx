'use client';

import { Search, Settings2 } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Button, Input } from '@repo/ui';

import type { ExperienceCategory } from '@repo/api-types';

type FilterValue = 'all' | string;

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
  summary: string;
  categories: ExperienceCategory[];
  onManageCategories: () => void;
};

export const ContentCatalogToolbar = ({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  summary,
  categories,
  onManageCategories,
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
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={cn(
            'font-inter rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            activeFilter === 'all'
              ? 'bg-manager-accent text-white'
              : 'border border-[#e5e0d8] bg-white text-manager-text-muted hover:text-manager-text',
          )}
        >
          All
        </button>
        {categories
          .filter((category) => category.isActive)
          .map((category) => {
            const isActive = activeFilter === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onFilterChange(category.id)}
                className={cn(
                  'font-inter rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-manager-accent text-white'
                    : 'border border-[#e5e0d8] bg-white text-manager-text-muted hover:text-manager-text',
                )}
              >
                {category.name}
              </button>
            );
          })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full px-3"
          onClick={onManageCategories}
        >
          <Settings2 className="size-3.5" />
          Manage
        </Button>
      </div>
    </div>

    <p className="font-inter shrink-0 text-sm text-manager-text-muted">{summary}</p>
  </div>
);
