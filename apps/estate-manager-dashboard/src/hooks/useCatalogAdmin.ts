import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emCatalogApi } from '@/lib/api/catalog';
import type {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
} from '@repo/api-types';

export function useCatalogAdmin() {
  return useQuery({
    queryKey: ['catalog', 'admin'],
    queryFn: emCatalogApi.adminAll,
    staleTime: 60_000,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['catalog', 'recommendations'],
    queryFn: emCatalogApi.recommendations,
    staleTime: 60_000,
  });
}

export function useToggleCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emCatalogApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCatalogItemDto) => emCatalogApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCatalogItemDto }) =>
      emCatalogApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emCatalogApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}

export function useImportCatalogCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => emCatalogApi.importCsv(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}
