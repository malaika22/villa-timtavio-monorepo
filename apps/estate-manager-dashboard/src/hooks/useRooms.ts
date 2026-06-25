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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
