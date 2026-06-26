export interface GuestNotification {
  id: string;
  bookingId: string;
  recipientEmail: string;
  type: string;
  title: string;
  body: string;
  deepLink?: string | null;
  status: 'UNREAD' | 'READ';
  readAt?: string | null;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}
