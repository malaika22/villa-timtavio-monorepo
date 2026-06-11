'use client';

import { cn } from '@repo/ui/lib/utils';

import { contentCatalogTabCounts } from '@/lib/content-catalog-mock-data';
import type { ContentCatalogTab } from '@/types';

const TABS: { value: ContentCatalogTab; label: string }[] = [
  { value: 'experiences', label: 'Experiences' },
  { value: 'menus', label: 'Menus' },
  { value: 'recommendations', label: 'Recommendations' },
];

type Props = {
  activeTab: ContentCatalogTab;
  onTabChange: (tab: ContentCatalogTab) => void;
  experienceCount?: number;
};

export const ContentCatalogTabs = ({
  activeTab,
  onTabChange,
  experienceCount,
}: Props) => (
  <nav className="flex flex-wrap gap-8 border-b border-[#ebe6df]">
    {TABS.map((tab) => {
      const isActive = activeTab === tab.value;
      const count =
        tab.value === 'experiences' && experienceCount != null
          ? experienceCount
          : contentCatalogTabCounts[tab.value];
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'font-inter relative pb-3 text-sm font-medium transition-colors',
            isActive
              ? 'text-manager-accent'
              : 'text-manager-text-muted hover:text-manager-text',
          )}
        >
          {tab.label} ({count})
          {isActive ? (
            <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-manager-accent" />
          ) : null}
        </button>
      );
    })}
  </nav>
);
