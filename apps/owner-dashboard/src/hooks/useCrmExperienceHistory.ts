'use client';

import { useQuery } from '@tanstack/react-query';
import { crmApi } from '@/lib/api/crm';

export function useCrmExperienceHistory(guestId: string | null) {
  return useQuery({
    queryKey: ['crm', guestId, 'experience-history'],
    queryFn: () => crmApi.getExperienceHistory(guestId!),
    enabled: !!guestId,
  });
}
