import { api, API } from '@/lib/api';
import type { GuestNotification, UnreadCount } from '@repo/api-types';

export const notificationsApi = {
  list: (bookingId: string) =>
    api.get<GuestNotification[]>(API.notifications.list(bookingId)),
  unreadCount: (bookingId: string) =>
    api.get<UnreadCount>(API.notifications.unreadCount(bookingId)),
  markRead: (id: string) =>
    api.patch<GuestNotification>(API.notifications.markRead(id)),
  markAllRead: (bookingId: string) =>
    api.post<{ count: number }>(API.notifications.markAllRead(bookingId)),
  savePushSubscription: (body: {
    endpoint: string;
    p256dhKey: string;
    authKey: string;
    userAgent?: string;
  }) => api.post<unknown>(API.notifications.pushSubscription, body),
};
