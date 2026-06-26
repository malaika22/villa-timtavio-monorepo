import { useQuery } from '@tanstack/react-query';
import { emCalendarApi } from '@/lib/api/calendar';

export function useCalendar(start?: string) {
  return useQuery({
    queryKey: ['calendar', start ?? 'current'],
    queryFn: () => emCalendarApi.week(start),
    staleTime: 30_000,
  });
}
