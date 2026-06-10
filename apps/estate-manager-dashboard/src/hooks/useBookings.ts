import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emBookingsApi } from '@/lib/api/bookings';
import type { UpdateBookingStatusDto } from '@repo/api-types';

export function useApproveManifest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => emBookingsApi.approveManifest(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      dto,
    }: {
      bookingId: string;
      dto: UpdateBookingStatusDto;
    }) => emBookingsApi.updateStatus(bookingId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
