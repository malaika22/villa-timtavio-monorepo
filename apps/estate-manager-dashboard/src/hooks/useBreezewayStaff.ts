import { useQuery } from '@tanstack/react-query';
import { emBreezewayApi } from '@/lib/api/breezeway';

export function useBreezewayStaff() {
  return useQuery({
    queryKey: ['breezeway-staff'],
    queryFn: emBreezewayApi.staff,
    staleTime: 5 * 60_000,
  });
}
