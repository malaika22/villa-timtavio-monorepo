import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emManifestApi } from '@/lib/api/manifest';

export function useManifest(bookingId: string | null) {
  return useQuery({
    queryKey: ['manifest', bookingId],
    queryFn: () => emManifestApi.getManifest(bookingId!),
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}

export function useApproveManifest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => emManifestApi.approve(bookingId),
    onSuccess: (_data, bookingId) => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['guests', 'current'] });
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
