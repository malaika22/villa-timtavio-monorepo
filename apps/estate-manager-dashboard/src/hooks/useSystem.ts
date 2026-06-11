'use client';

import { useQuery } from '@tanstack/react-query';

import { emFolioApi } from '@/lib/api/folio';
import { systemApi } from '@/lib/api/system';

export function useDailyRevenue() {
  return useQuery({
    queryKey: ['folio', 'daily-revenue'],
    queryFn: emFolioApi.dailyRevenue,
    refetchInterval: 60_000,
  });
}

export function useLodgifySyncStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['system', 'lodgify-sync'],
    queryFn: systemApi.lodgifySyncStatus,
    refetchInterval: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useSystemAlerts(category?: string) {
  return useQuery({
    queryKey: ['system', 'alerts', category ?? 'all'],
    queryFn: () =>
      systemApi.alerts({
        category,
        isDismissed: false,
      }),
    refetchInterval: 60_000,
  });
}
