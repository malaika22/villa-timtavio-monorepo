import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api/bookings';
import { useAuth } from './useAuth';
import { useBookingStore } from '@/store/useBookingStore';
import { useEffect } from 'react';

export function useCurrentBooking() {
  const { bookingId } = useAuth();
  const setBooking = useBookingStore((s) => s.setBooking);

  const query = useQuery({
    queryKey: ['booking', 'current'],
    queryFn: bookingsApi.getCurrent,
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (query.data) {
      setBooking(query.data);
    }
  }, [query.data, setBooking]);

  return query;
}
