'use client';
import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useQueryClient } from '@tanstack/react-query';
import { config } from '@/config';
import { API } from '@/lib/api';

const PUSHER_EVENTS = {
  FOLIO_UPDATED: 'folio.updated',
  EXPERIENCE_STATUS_CHANGED: 'experience.status_changed',
  EXPERIENCE_READY: 'experience.ready',
  SECONDARY_REQUEST_PENDING: 'secondary_request_pending',
  BOOKING_STATUS_CHANGED: 'booking.status_changed',
  BOOKING_CHECKED_OUT: 'booking.checked_out',
};

export function usePusherChannel(bookingId: string | null) {
  const queryClient = useQueryClient();
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const key = config.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = config.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, {
      cluster,
      channelAuthorization: {
        transport: 'ajax',
        endpoint: `${config.NEXT_PUBLIC_API_URL}${API.pusher.auth}`,
        headers: {
          Authorization: `Bearer ${
            typeof window !== 'undefined'
              ? localStorage.getItem('access_token')
              : ''
          }`,
        },
      },
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(`private-booking-${bookingId}`);

    channel.bind(PUSHER_EVENTS.EXPERIENCE_STATUS_CHANGED, () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', bookingId] });
    });

    channel.bind(PUSHER_EVENTS.EXPERIENCE_READY, () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', bookingId] });
    });

    channel.bind(PUSHER_EVENTS.SECONDARY_REQUEST_PENDING, () => {
      void queryClient.invalidateQueries({ queryKey: ['requests', bookingId] });
    });

    channel.bind(PUSHER_EVENTS.FOLIO_UPDATED, () => {
      void queryClient.invalidateQueries({ queryKey: ['folio', bookingId] });
    });

    channel.bind(PUSHER_EVENTS.BOOKING_STATUS_CHANGED, () => {
      void queryClient.invalidateQueries({ queryKey: ['booking', 'current'] });
    });

    channel.bind(PUSHER_EVENTS.BOOKING_CHECKED_OUT, () => {
      void queryClient.invalidateQueries({ queryKey: ['booking', 'current'] });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-booking-${bookingId}`);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [bookingId, queryClient]);
}
