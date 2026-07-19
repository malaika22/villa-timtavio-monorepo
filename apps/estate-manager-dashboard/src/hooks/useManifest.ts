import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emManifestApi } from '@/lib/api/manifest';
import type {
  UpdateManifestGuestDto,
  GuestArrivalStatus,
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
  return useMutation({
    mutationFn: ({
      guestId,
      status,
    }: {
      guestId: string;
      status: GuestArrivalStatus;
    }) => emManifestApi.setGuestArrivalStatus(bookingId, guestId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
    },
  });
}

export function useSetPrimaryArrivalStatus(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: GuestArrivalStatus) =>
      emManifestApi.setPrimaryArrivalStatus(bookingId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
    },
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
