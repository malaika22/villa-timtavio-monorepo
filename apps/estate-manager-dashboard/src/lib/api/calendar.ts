import { api, API } from '@/lib/api';
import type { WeekCalendar } from '@repo/api-types';

export const emCalendarApi = {
  week: (start?: string) =>
    api.get<WeekCalendar>(API.dashboard.calendar(start)),
};
