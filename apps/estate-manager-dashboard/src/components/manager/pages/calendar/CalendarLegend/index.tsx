import { calendarLegendItems } from '@/lib/calendar-mock-data';

import { calendarEventStyles } from '@/components/manager/pages/calendar/calendar-event-styles';

export const CalendarLegend = () => (
  <ul className="font-inter flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-manager-text-muted">
    {calendarLegendItems.map((item) => (
      <li key={item.type} className="flex items-center gap-2">
        <span
          className={`size-3 shrink-0 rounded-sm ${calendarEventStyles[item.type].swatch}`}
          aria-hidden
        />
        {item.label}
      </li>
    ))}
  </ul>
);
