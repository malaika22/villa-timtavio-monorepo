import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms';
import { useBookingScope, whileResolving } from './useBookingScope';

export function useRoomAvailability() {
  const { bookingId, resolving } = useBookingScope();

  const query = useQuery({
    queryKey: ['rooms', 'availability', bookingId],
    queryFn: () => roomsApi.availability(bookingId!),
    enabled: !!bookingId,
    staleTime: 60_000,
  });

  return whileResolving(query, resolving);
}
