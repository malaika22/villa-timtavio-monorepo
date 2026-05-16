'use client';

import { cn } from '@repo/ui/lib/utils';

import type { BookingTab } from '@/types';

const TABS: {
  value: BookingTab;
  label: string;
  badge?: number;
  badgeVariant?: 'red' | 'green';
}[] = [
  { value: 'current', label: 'Current Booking' },
  { value: 'upcoming', label: 'Upcoming Bookings', badge: 4, badgeVariant: 'red' },
  { value: 'past', label: 'Past Bookings' },
  { value: 'manifest', label: 'Manifest Review', badge: 1, badgeVariant: 'green' },
];

export const BookingsTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: BookingTab;
  onTabChange: (tab: BookingTab) => void;
}) => (
  <nav className="flex flex-wrap gap-6 border-b border-[#ebe6df]">
    {TABS.map((tab) => {
      const isActive = activeTab === tab.value;
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors',
            isActive ? 'text-manager-text' : 'text-manager-text-muted hover:text-manager-text',
          )}
        >
          {tab.label}
          {tab.badge != null ? (
            <span
              className={cn(
                'flex size-5 min-w-5 items-center justify-center rounded-full text-xs font-semibold text-white',
                tab.badgeVariant === 'green' ? 'bg-[#1e7e34]' : 'bg-[#c45c3e]',
              )}
            >
              {tab.badge}
            </span>
          ) : null}
          {isActive ? (
            <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-manager-text" />
          ) : null}
        </button>
      );
    })}
  </nav>
);
