import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/lib/api/catalog';
import type { CatalogCategory } from '@repo/api-types';

export function useCatalog(category?: CatalogCategory) {
  return useQuery({
    queryKey: ['catalog', category ?? 'all'],
    queryFn: () => catalogApi.list(category),
    staleTime: 60_000,
  });
}

export function useCatalogDetail(id: string | null) {
  return useQuery({
    queryKey: ['catalog', id, 'detail'],
    queryFn: () => catalogApi.detail(id!),
    enabled: !!id,
  });
}

export function useCatalogRecommendations() {
  return useQuery({
    queryKey: ['catalog', 'recommendations'],
    queryFn: catalogApi.recommendations,
    staleTime: 60_000,
  });
}

export function useCatalogIncluded() {
  return useQuery({
    queryKey: ['catalog', 'included'],
    queryFn: catalogApi.included,
    staleTime: 60_000,
  });
}
