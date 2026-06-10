import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emFolioApi } from '@/lib/api/folio';
import type { CreateFolioItemDto, UpdateFolioItemDto } from '@repo/api-types';

export function useFolioEM(bookingId: string | null) {
  return useQuery({
    queryKey: ['folio', bookingId],
    queryFn: () => emFolioApi.byBooking(bookingId!),
    enabled: !!bookingId,
  });
}

export function useAddFolioCharge(bookingId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFolioItemDto) =>
      emFolioApi.addCharge(bookingId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folio', bookingId] });
    },
  });
}

export function useUpdateFolioCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      dto,
    }: {
      itemId: string;
      dto: UpdateFolioItemDto;
    }) => emFolioApi.updateCharge(itemId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folio'] });
    },
  });
}

export function useCheckout(bookingId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => emFolioApi.checkout(bookingId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folio', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
