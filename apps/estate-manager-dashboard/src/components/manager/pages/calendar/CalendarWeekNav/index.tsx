'use client';

import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@repo/ui';

import { calendarWeekLabel } from '@/lib/calendar-mock-data';
import type { CalendarViewMode } from '@/types';

const viewLabels: Record<CalendarViewMode, string> = {
  day: 'Friday, March 27, 2026',
  week: calendarWeekLabel,
  month: 'March 2026',
};

type Props = {
  view?: CalendarViewMode;
};

export const CalendarWeekNav = ({ view = 'week' }: Props) => (
  <div className="flex flex-col gap-3 rounded-xl border border-[#e8e4de] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(26,22,20,0.04)] sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center justify-center gap-2 sm:justify-start">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 text-manager-text-muted hover:bg-[#faf9f7] hover:text-manager-text"
        aria-label="Previous period"
      >
        <ChevronLeft className="size-5" strokeWidth={1.75} />
      </Button>
      <p className="font-cormorant min-w-[200px] text-center text-2xl text-manager-text sm:min-w-[260px]">
        {viewLabels[view]}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 text-manager-text-muted hover:bg-[#faf9f7] hover:text-manager-text"
        aria-label="Next period"
      >
        <ChevronRight className="size-5" strokeWidth={1.75} />
      </Button>
    </div>

    <div className="flex items-center justify-center gap-2 sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="font-inter h-10 rounded-lg border-manager-border bg-white px-5 text-sm font-medium text-manager-text shadow-none hover:bg-[#faf9f7]"
      >
        Today
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 rounded-lg border-manager-border bg-white shadow-none hover:bg-[#faf9f7]"
        aria-label="Download calendar"
      >
        <Download className="size-4 text-manager-text-muted" strokeWidth={1.75} />
      </Button>
    </div>
  </div>
);
