import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emMenuApi } from '@/lib/api/menu';
import type { MenuItemDto } from '@repo/api-types';

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: emMenuApi.list,
    staleTime: 60_000,
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: MenuItemDto) => emMenuApi.create(dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<MenuItemDto> }) =>
      emMenuApi.update(id, dto),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emMenuApi.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}
