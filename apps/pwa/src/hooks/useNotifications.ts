import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import {
  useBookingId,
  useBookingScope,
  whileResolving,
} from './useBookingScope';

export function useNotifications() {
  const { bookingId, resolving } = useBookingScope();
  const query = useQuery({
    queryKey: ['notifications', bookingId],
    queryFn: () => notificationsApi.list(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 60_000,
  });
  return whileResolving(query, resolving);
}

export function useUnreadCount() {
  const { bookingId, resolving } = useBookingScope();
  const query = useQuery({
    queryKey: ['notifications', bookingId, 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 60_000,
  });
  return whileResolving(query, resolving);
}

export function useMarkNotificationRead() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications', bookingId],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(bookingId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications', bookingId],
      });
    },
  });
}
