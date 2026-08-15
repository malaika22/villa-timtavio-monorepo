'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export function useAllSystemAlerts(category?: string) {
  return useQuery({
    queryKey: ['system', 'alerts', 'history', category ?? 'all'],
    queryFn: () => systemApi.alerts({ category, isDismissed: 'all' }),
    refetchInterval: 60_000,
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => systemApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['system', 'alerts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDismissSystemAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemApi.dismissAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['system', 'alerts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Clears the lot.
 *
 * The endpoint has existed all along with nothing calling it, so the only way
 * to empty the panel was to tick twelve alerts one at a time — which nobody
 * does, so the list only ever grew. Alerts here are notices rather than tasks:
 * the work they point at lives in Approvals, Bookings and Inquiries, and those
 * queues are the real record.
 */
export function useClearSystemAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => systemApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['system', 'alerts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
