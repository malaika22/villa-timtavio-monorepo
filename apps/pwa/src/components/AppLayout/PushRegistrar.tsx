'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePusherChannel } from '@/hooks/usePusherChannel';

/**
 * Headless global bridge: subscribes to the booking's real-time channel and
 * registers the device for Web Push. Mounted once in AppLayout so live
 * updates (folio, experiences, booking status) reach every screen — not just
 * Home.
 */
export const PushRegistrar = () => {
  const { bookingId } = useAuth();
  usePusherChannel(bookingId ?? null);
  usePushNotifications();
  return null;
};
