'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

/** Headless: registers the device for Web Push when authenticated. */
export const PushRegistrar = () => {
  usePushNotifications();
  return null;
};
