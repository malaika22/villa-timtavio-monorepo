import type { UseQueryResult } from '@tanstack/react-query';

import { useAuth } from './useAuth';
import { useBookingStore } from '@/store/useBookingStore';

/**
 * Which booking we're in, and whether we know yet.
 *
 * `bookingId` comes out of the JWT, decoded in an effect in the auth provider —
 * so on a cold load there are a frame or two where it is null. Every
 * booking-scoped query is `enabled: !!bookingId`, and React Query calls a
 * disabled query *pending but not fetching*, which means `isLoading` is
 * `false`. The screens therefore rendered neither a skeleton nor any data:
 * they showed their empty state, sometimes with copy as wrong as "no
 * experiences requested yet", and only then the skeleton, and only then the
 * content. Three states where there should be two.
 *
 * Waiting to find out which booking we're in *is* loading.
 */
export function useBookingScope() {
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const { bookingId: authBookingId, isLoading: authLoading } = useAuth();
  const bookingId = storeBookingId ?? authBookingId;

  return {
    bookingId,
    /** True while we still don't know, so callers can hold the skeleton up. */
    resolving: authLoading || !bookingId,
  };
}

/** The id alone, for mutations and query keys. */
export function useBookingId(): string | null {
  return useBookingScope().bookingId;
}

/**
 * Report a booking-scoped query as loading while the booking is still being
 * resolved.
 *
 * Deliberately narrow: it overrides the two flags components branch on and
 * leaves everything else — `data`, `error`, `refetch` — exactly as it was.
 */
export function whileResolving<T>(
  query: UseQueryResult<T>,
  resolving: boolean,
): UseQueryResult<T> {
  if (!resolving) return query;
  return { ...query, isLoading: true, isPending: true } as UseQueryResult<T>;
}
