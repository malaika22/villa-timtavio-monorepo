import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '@/lib/api/requests';
import { useAuth } from './useAuth';
import type { ExperienceRequest } from '@repo/api-types';

export interface TodayScheduleItem {
  id: string;
  scheduledTime: string;
  title: string;
  location?: string;
  status: ExperienceRequest['status'];
}

export function useTodaySchedule() {
  const { bookingId } = useAuth();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['requests', bookingId, 'today'],
    queryFn: () => requestsApi.byBooking(bookingId!, 'today'),
    enabled: !!bookingId,
  });

  const todayItems: TodayScheduleItem[] = (requests ?? []).map((r) => ({
    id: r.id,
    scheduledTime: r.confirmedDate ?? r.preferredDate,
    title: r.catalogItem?.name ?? 'Experience',
    status: r.status,
  }));

  return { todayItems, isLoading, error };
}
