import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emRoomsApi } from '@/lib/api/rooms';
import type { CreateRoomDto, UpdateRoomDto } from '@repo/api-types';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: emRoomsApi.list,
    staleTime: 60_000,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoomDto) => emRoomsApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ number, dto }: { number: number; dto: UpdateRoomDto }) =>
      emRoomsApi.update(number, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useToggleRoomActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (number: number) => emRoomsApi.toggleActive(number),
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(
        room?.isActive
          ? `Room ${room.number} is back in service`
          : `Room ${room?.number ?? ''} is out of service`.trim(),
      );
    },
    onError: (e) => toast.error((e as Error).message),
  });
}
