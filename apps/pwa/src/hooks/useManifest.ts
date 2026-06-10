import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { manifestApi } from '@/lib/api/manifest';
import type {
  CreateManifestGuestDto,
  UpdateManifestGuestDto,
} from '@repo/api-types';
import { useBookingStore } from '@/store/useBookingStore';

export function useManifest() {
  const bookingId = useBookingStore((s) => s.bookingId);
  return useQuery({
    queryKey: ['manifest', bookingId],
    queryFn: () => manifestApi.getManifest(bookingId!),
    enabled: !!bookingId,
    staleTime: 30_000,
  });
}

export function useAddManifestGuest() {
  const queryClient = useQueryClient();
  const bookingId = useBookingStore((s) => s.bookingId);
  return useMutation({
    mutationFn: (dto: CreateManifestGuestDto) =>
      manifestApi.addGuest(bookingId!, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['booking', 'current'] });
    },
  });
}

export function useUpdateManifestGuest() {
  const queryClient = useQueryClient();
  const bookingId = useBookingStore((s) => s.bookingId);
  return useMutation({
    mutationFn: ({
      guestId,
      dto,
    }: {
      guestId: string;
      dto: UpdateManifestGuestDto;
    }) => manifestApi.updateGuest(bookingId!, guestId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
    },
  });
}

export function useRemoveManifestGuest() {
  const queryClient = useQueryClient();
  const bookingId = useBookingStore((s) => s.bookingId);
  return useMutation({
    mutationFn: (guestId: string) =>
      manifestApi.removeGuest(bookingId!, guestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['booking', 'current'] });
    },
  });
}

export function useSubmitManifest() {
  const queryClient = useQueryClient();
  const bookingId = useBookingStore((s) => s.bookingId);
  return useMutation({
    mutationFn: () => manifestApi.submit(bookingId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['manifest', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['booking', 'current'] });
    },
  });
}
