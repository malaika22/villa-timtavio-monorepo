import { useQuery } from '@tanstack/react-query';
import { folioApi } from '@/lib/api/folio';
import { useBookingScope, whileResolving } from './useBookingScope';

export function useFolio() {
  const { bookingId, resolving } = useBookingScope();

  const query = useQuery({
    queryKey: ['folio', bookingId],
    queryFn: () => folioApi.byBooking(bookingId!),
    enabled: !!bookingId,
  });

  return whileResolving(query, resolving);
}
