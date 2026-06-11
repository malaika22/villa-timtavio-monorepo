'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export function useEmRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!PUSHER_KEY || !PUSHER_CLUSTER) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pusher: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    let cancelled = false;

    void (async () => {
      const Pusher = (await import('pusher-js')).default;
      if (cancelled) return;

      pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/pusher/auth-em`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
          },
        },
      });

      channel = pusher.subscribe('private-em-dashboard');

      const invalidateDashboard = () => {
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        void queryClient.invalidateQueries({
          queryKey: ['requests', 'em-queue'],
        });
        void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      };

      channel.bind('new_request', invalidateDashboard);
      channel.bind('manifest_submitted', invalidateDashboard);
      channel.bind('new_inquiry', invalidateDashboard);
      channel.bind('booking_arrived', invalidateDashboard);
    })();

    return () => {
      cancelled = true;
      channel?.unbind_all();
      channel?.unsubscribe();
      pusher?.disconnect();
    };
  }, [queryClient]);
}
