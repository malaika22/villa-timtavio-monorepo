import type { CalendarTimelineEventType } from '@/types';

export const calendarEventStyles: Record<
  CalendarTimelineEventType,
  { pill: string; swatch: string }
> = {
  occupancy: {
    pill: 'bg-[#e8ddd4] text-[#4a3f38]',
    swatch: 'bg-[#e8ddd4]',
  },
  experience: {
    pill: 'bg-[#f3e4e4] text-[#6b4545]',
    swatch: 'bg-[#f3e4e4]',
  },
  arrival: {
    pill: 'bg-[#e3f0e6] text-[#2d5a3d]',
    swatch: 'bg-[#e3f0e6]',
  },
  departure: {
    pill: 'bg-[#f5e8ea] text-[#7a4a4a]',
    swatch: 'bg-[#f5e8ea]',
  },
};
