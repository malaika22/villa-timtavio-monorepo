'use client';

import { cn } from '@repo/ui/lib/utils';

import type { CalendarViewMode } from '@/types';

const TABS: { value: CalendarViewMode; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

type Props = {
  activeView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
};

export const CalendarViewTabs = ({ activeView, onViewChange }: Props) => (
  <div className="inline-flex items-center gap-0.5 rounded-lg border border-manager-border bg-manager-card p-1">
    {TABS.map((tab) => {
      const isActive = activeView === tab.value;
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onViewChange(tab.value)}
          className={cn(
            'font-inter rounded-md px-5 py-2.5 text-sm font-medium transition-colors',
            isActive
              ? 'bg-manager-accent text-white'
              : 'text-[#707070] hover:text-manager-text',
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);
