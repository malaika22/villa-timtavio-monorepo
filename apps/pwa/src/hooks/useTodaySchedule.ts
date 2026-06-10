import { useMemo } from 'react';
import { isToday, parseISO } from 'date-fns';
import { useBookingRequests } from './useRequests';
import type { ExperienceRequest } from '@repo/api-types';

export interface TodayScheduleItem {
  id: string;
  scheduledTime: string;
  title: string;
  location?: string;
  status: ExperienceRequest['status'];
}

export function useTodaySchedule() {
  const { data: requests, isLoading, error } = useBookingRequests();

  const todayItems = useMemo<TodayScheduleItem[]>(() => {
    if (!requests) return [];
    return requests
      .filter((r) => {
        const dateStr = r.confirmedDate ?? r.preferredDate;
        return (
          isToday(parseISO(dateStr)) &&
          ['CONFIRMED', 'IN_PROGRESS', 'READY'].includes(r.status)
        );
      })
      .map((r) => ({
        id: r.id,
        scheduledTime: r.confirmedDate ?? r.preferredDate,
        title: r.catalogItem?.name ?? 'Experience',
        status: r.status,
      }));
  }, [requests]);

  return { todayItems, isLoading, error };
}
