import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';

function useBookingId(): string | null {
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const { bookingId: authBookingId } = useAuth();
  return storeBookingId ?? authBookingId;
}

export function useNotifications() {
  const bookingId = useBookingId();
  return useQuery({
    queryKey: ['notifications', bookingId],
    queryFn: () => notificationsApi.list(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  const bookingId = useBookingId();
  return useQuery({
    queryKey: ['notifications', bookingId, 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 60_000,
  });
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
