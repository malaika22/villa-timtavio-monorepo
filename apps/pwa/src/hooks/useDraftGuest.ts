import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manifestApi } from '@/lib/api/manifest';

export function useDraftGuest(bookingId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['manifest-draft', bookingId],
    queryFn: () => manifestApi.getDraft(bookingId!),
    enabled: !!bookingId,
    staleTime: 0,
    retry: false,
  });

  const upsert = useMutation({
    mutationFn: (args: { data: Record<string, unknown>; guestId?: string }) =>
      manifestApi.upsertDraft(bookingId!, {
        data: args.data,
        guestId: args.guestId,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['manifest-draft', bookingId], updated);
    },
  });

  const clear = useMutation({
    mutationFn: () => manifestApi.deleteDraft(bookingId!),
    // Clear the cached draft immediately (optimistic) and cancel any in-flight
    // fetch, so reopening the form for the next guest can't refill it with the
    // just-submitted guest's data before the delete round-trip lands (BUG-8).
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['manifest-draft', bookingId],
      });
      queryClient.setQueryData(['manifest-draft', bookingId], null);
    },
    onSuccess: () => {
      queryClient.setQueryData(['manifest-draft', bookingId], null);
    },
  });

  return { query, upsert, clear };
}
