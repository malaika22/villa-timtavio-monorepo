import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms';
import { useAuth } from './useAuth';

export function useRoomAvailability() {
  const { bookingId } = useAuth();
  return useQuery({
    queryKey: ['rooms', 'availability', bookingId],
    queryFn: () => roomsApi.availability(bookingId!),
    enabled: !!bookingId,
    staleTime: 60_000,
  });
}
