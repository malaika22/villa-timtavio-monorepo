import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emManifestApi } from '@/lib/api/manifest';
import type {
  UpdateManifestGuestDto,
  GuestArrivalStatus,
  ManifestResponse,
} from '@repo/api-types';

export function useManifest(bookingId: string | null) {
  return useQuery({
    queryKey: ['manifest', bookingId],
    queryFn: () => emManifestApi.getManifest(bookingId!),
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}

export function useUpdateManifestGuest(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      guestId,
      dto,
    }: {
      guestId: string;
      dto: UpdateManifestGuestDto;
    }) => emManifestApi.updateGuest(bookingId, guestId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
    },
  });
}

export function useSetGuestArrivalStatus(bookingId: string) {
  const queryClient = useQueryClient();
  const key = ['manifest', bookingId];
  return useMutation({
    mutationFn: ({
      guestId,
      status,
    }: {
      guestId: string;
      status: GuestArrivalStatus;
    }) => emManifestApi.setGuestArrivalStatus(bookingId, guestId, status),
    // Reflect the change instantly, then reconcile — so the pill responds on tap.
    onMutate: async ({ guestId, status }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<ManifestResponse>(key);
      queryClient.setQueryData<ManifestResponse>(key, (old) =>
        old
          ? {
              ...old,
              guests: old.guests.map((g) =>
                g.id === guestId ? { ...g, arrivalStatus: status } : g,
              ),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useSetPrimaryArrivalStatus(bookingId: string) {
  const queryClient = useQueryClient();
  const key = ['manifest', bookingId];
  return useMutation({
    mutationFn: (status: GuestArrivalStatus) =>
      emManifestApi.setPrimaryArrivalStatus(bookingId, status),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<ManifestResponse>(key);
      queryClient.setQueryData<ManifestResponse>(key, (old) =>
        old
          ? { ...old, primaryGuest: { ...old.primaryGuest, arrivalStatus: status } }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Marks the brief as read.
 *
 * Replaces useApproveManifest. Approving gated nothing — secondary guests get
 * their access when they're added — so the only fact worth keeping was when
 * the estate last looked, which is what warns them a guest changed something
 * after the brief went to the chef.
 */
export function useMarkBriefViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => emManifestApi.markBriefViewed(bookingId),
    onSuccess: (_data, bookingId) => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useChefsBrief(bookingId: string | null) {
  return useQuery({
    queryKey: ['manifest', bookingId, 'chefs-brief'],
    queryFn: () => emManifestApi.chefsBrief(bookingId!),
    enabled: !!bookingId,
  });
}

export function useResendGuestLink() {
  return useMutation({
    mutationFn: ({
      bookingId,
      guestId,
    }: {
      bookingId: string;
      guestId: string;
    }) => emManifestApi.resendLink(bookingId, guestId),
  });
}
