import { useQuery } from '@tanstack/react-query';
import { ownerCatalogApi } from '@/lib/api/catalog';
import { mapCatalogItemToPerformanceRow } from '@/lib/mappers/catalog';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog', 'all'],
    queryFn: ownerCatalogApi.adminAll,
    staleTime: 60_000,
  });
}

export function useCatalogAsPerformanceRows() {
  return useQuery({
    queryKey: ['catalog', 'all'],
    queryFn: ownerCatalogApi.adminAll,
    select: (data) => data.map(mapCatalogItemToPerformanceRow),
    staleTime: 60_000,
  });
}
