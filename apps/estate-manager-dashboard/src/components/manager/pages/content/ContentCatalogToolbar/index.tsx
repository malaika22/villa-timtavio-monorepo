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
  action?: React.ReactNode;
  loading?: boolean;
};

export const ContentCatalogToolbar = ({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  summary,
  categories,
  onManageCategories,
  action,
  loading = false,
}: Props) => {
  const activeCategories = categories.filter((category) => category.isActive);

  return (
    <div className="flex flex-col gap-3">
      {/* Search + summary + action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#a8a29e]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search experiences..."
            className="font-inter h-10 w-full rounded-lg border-manager-border bg-white pl-9 text-sm shadow-none placeholder:text-[#a8a29e]"
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="font-inter whitespace-nowrap text-sm text-manager-text-muted">
            {summary}
          </p>
          {action}
        </div>
      </div>

      {/* Category filter rail — scrolls horizontally so it never wraps/crowds */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 snap-x overflow-x-auto pr-1 [-webkit-mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-12px),transparent)] [mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-12px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-1.5 pb-0.5 pl-3">
            {loading ? (
              [64, 92, 78, 108, 84].map((w, i) => (
                <div
                  key={i}
                  className="h-8 shrink-0 animate-pulse rounded-full bg-manager-border"
                  style={{ width: w }}
                />
              ))
            ) : (
              <>
                <FilterChip
                  label="All"
                  active={activeFilter === 'all'}
                  onClick={() => onFilterChange('all')}
                />
                {activeCategories.map((category) => (
                  <FilterChip
                    key={category.id}
                    label={category.name}
                    active={activeFilter === category.id}
                    onClick={() => onFilterChange(category.id)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1 rounded-full px-3"
          onClick={onManageCategories}
        >
          <Settings2 className="size-3.5" />
          Manage
        </Button>
      </div>
    </div>
  );
};

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'font-inter shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-manager-accent text-white'
          : 'border border-[#e5e0d8] bg-white text-manager-text-muted hover:text-manager-text',
      )}
    >
      {label}
    </button>
  );
}
