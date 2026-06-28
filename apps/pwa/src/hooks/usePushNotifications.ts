'use client';

import { useEffect } from 'react';
import { notificationsApi } from '@/lib/api/notifications';
import { useAuth } from './useAuth';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function bufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Registers the device for Web Push once authenticated. Fully guarded:
 * - no-ops without a VAPID public key, SW support, or push support;
 * - only subscribes after the user grants notification permission.
 */
export function usePushNotifications() {
  const { isAuthenticated, bookingId } = useAuth();

  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!isAuthenticated || !bookingId || !vapidKey) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    let cancelled = false;

    (async () => {
      try {
        if (Notification.permission === 'denied') return;
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') return;
        }

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        const sub =
          existing ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
          }));
        if (cancelled) return;

        const json = sub.toJSON();
        await notificationsApi.savePushSubscription({
          endpoint: sub.endpoint,
          p256dhKey: json.keys?.p256dh ?? bufferToBase64(sub.getKey('p256dh')),
          authKey: json.keys?.auth ?? bufferToBase64(sub.getKey('auth')),
          userAgent: navigator.userAgent,
        });
      } catch {
        // Push is best-effort; never block the app on it.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bookingId]);
}
