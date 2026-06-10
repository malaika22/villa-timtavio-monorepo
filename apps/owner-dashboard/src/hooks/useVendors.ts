import { useQuery } from '@tanstack/react-query';
import { ownerVendorsApi } from '@/lib/api/vendors';
import { mapVendorToRoiRow } from '@/lib/mappers/vendor';

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: ownerVendorsApi.list,
    staleTime: 60_000,
  });
}

export function useVendorsAsRoiRows() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: ownerVendorsApi.list,
    select: (data) => data.map(mapVendorToRoiRow),
    staleTime: 60_000,
  });
}
