import { useQuery } from '@tanstack/react-query';
import { folioApi } from '@/lib/api/folio';
import { useAuth } from './useAuth';

export function useFolio() {
  const { bookingId } = useAuth();
  return useQuery({
    queryKey: ['folio', bookingId],
    queryFn: () => folioApi.byBooking(bookingId!),
    enabled: !!bookingId,
  });
}
