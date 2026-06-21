import { useQuery } from '@tanstack/react-query';
import { manifestApi } from '@/lib/api/manifest';

export function useManifestOptions(enabled = true) {
  return useQuery({
    queryKey: ['manifest-options'],
    queryFn: manifestApi.getOptions,
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}
