import { useQuery } from '@tanstack/react-query';
import { ownerCatalogApi } from '@/lib/api/catalog';

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog', 'all'],
    queryFn: ownerCatalogApi.adminAll,
    staleTime: 60_000,
  });
}
