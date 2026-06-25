import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';

export function useRoomAvailability() {
  // The booking store is the authoritative bookingId (populated by
  // useCurrentBooking); fall back to the JWT claim if it isn't set yet.
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const { bookingId: authBookingId } = useAuth();
  const bookingId = storeBookingId ?? authBookingId;

  return useQuery({
    queryKey: ['rooms', 'availability', bookingId],
    queryFn: () => roomsApi.availability(bookingId!),
    enabled: !!bookingId,
    staleTime: 60_000,
  });
}
