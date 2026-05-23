'use client';

import { useState } from 'react';

import { CalendarLegend } from '@/components/manager/pages/calendar/CalendarLegend';
import { CalendarViewTabs } from '@/components/manager/pages/calendar/CalendarViewTabs';
import { CalendarWeekGrid } from '@/components/manager/pages/calendar/CalendarWeekGrid';
import { CalendarWeekNav } from '@/components/manager/pages/calendar/CalendarWeekNav';
import type { CalendarViewMode } from '@/types';

export const CalendarPage = () => {
  const [activeView, setActiveView] = useState<CalendarViewMode>('week');

  return (
    <div className="font-inter space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CalendarViewTabs activeView={activeView} onViewChange={setActiveView} />
        <CalendarLegend />
      </div>

      <CalendarWeekNav view={activeView} />
      <CalendarWeekGrid />
    </div>
  );
};
