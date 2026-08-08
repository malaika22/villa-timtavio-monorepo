import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '@/lib/api/requests';
import { useBookingScope } from './useBookingScope';
import type { ExperienceRequest } from '@repo/api-types';

export interface TodayScheduleItem {
  id: string;
  scheduledTime: string;
  title: string;
  location?: string;
  status: ExperienceRequest['status'];
}

export function useTodaySchedule() {
  const { bookingId, resolving } = useBookingScope();

  const {
    data: requests,
    isLoading,
    error,
  } = useQuery({
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

  // Waiting to learn which booking we're in is loading, not "no schedule".
  return { todayItems, isLoading: isLoading || resolving, error };
}
