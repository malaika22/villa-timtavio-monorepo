import { useQuery } from '@tanstack/react-query';
import { folioApi } from '@/lib/api/folio';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';

export function useFolio() {
  // Booking store is authoritative; the JWT claim is often empty.
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const { bookingId: authBookingId } = useAuth();
  const bookingId = storeBookingId ?? authBookingId;

  return useQuery({
    queryKey: ['folio', bookingId],
    queryFn: () => folioApi.byBooking(bookingId!),
    enabled: !!bookingId,
  });
}
