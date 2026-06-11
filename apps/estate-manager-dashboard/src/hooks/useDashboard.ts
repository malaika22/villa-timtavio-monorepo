'use client';

import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/lib/api/dashboard';
import { emRequestsApi } from '@/lib/api/requests';
import {
  formatRevenueCompact,
  mapDashboardScheduleItem,
  mapEmRequestToApprovalItem,
  mapGuestToCurrentGuest,
} from '@/lib/mappers/dashboard';
import { useCurrentGuestsRaw } from './useGuests';

export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardApi.kpis,
    refetchInterval: 60_000,
  });
}

export function useAlertBanner() {
  return useQuery({
    queryKey: ['dashboard', 'alert-banner'],
    queryFn: dashboardApi.alertBanner,
    refetchInterval: 30_000,
  });
}

export function useDashboardSchedule() {
  return useQuery({
    queryKey: ['dashboard', 'schedule-today'],
    queryFn: dashboardApi.scheduleToday,
    refetchInterval: 60_000,
  });
}

export function useApprovalQueueCount() {
  return useQuery({
    queryKey: ['requests', 'em-queue'],
    queryFn: emRequestsApi.queue,
    refetchInterval: 60_000,
    select: (data) => data.length,
  });
}

export function useDashboardExport() {
  return useQuery({
    queryKey: ['dashboard', 'export'],
    queryFn: dashboardApi.export,
    enabled: false,
  });
}

export function useDashboard() {
  const guestsQuery = useCurrentGuestsRaw();
  const queueQuery = useQuery({
    queryKey: ['requests', 'em-queue'],
    queryFn: emRequestsApi.queue,
    refetchInterval: 60_000,
  });
  const kpisQuery = useDashboardKpis();
  const alertQuery = useAlertBanner();
  const scheduleQuery = useDashboardSchedule();

  const rawGuests = guestsQuery.data ?? [];
  const rawQueue = queueQuery.data ?? [];
  const kpis = kpisQuery.data;
  const alertBanner = alertQuery.data;
  const rawSchedule = scheduleQuery.data ?? [];

  const guests = rawGuests.map(mapGuestToCurrentGuest);
  const pendingApprovals = rawQueue.map(mapEmRequestToApprovalItem);
  const todaySchedule = rawSchedule.map(mapDashboardScheduleItem);

  const isLoading =
    guestsQuery.isLoading ||
    queueQuery.isLoading ||
    kpisQuery.isLoading ||
    alertQuery.isLoading ||
    scheduleQuery.isLoading;

  return {
    guests,
    kpis,
    alertBanner,
    pendingApprovals,
    pendingCount: alertBanner?.pendingApprovals ?? rawQueue.length,
    todaySchedule,
    revenueFormatted: formatRevenueCompact(kpis?.revenueToday ?? 0),
    isLoading,
    error:
      guestsQuery.error ??
      queueQuery.error ??
      kpisQuery.error ??
      alertQuery.error ??
      scheduleQuery.error,
  };
}
