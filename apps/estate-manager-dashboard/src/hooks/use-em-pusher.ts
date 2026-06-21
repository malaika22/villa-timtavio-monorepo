'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Channel } from 'pusher-js';

import {
  disconnectDashboardPusher,
  getDashboardPusherClient,
} from '@/lib/pusher-client';

function showDashboardToast(
  type: 'info' | 'warning' | 'success' | 'error',
  title: string,
  message: string,
) {
  const options = { description: message, duration: 6000 };

  switch (type) {
    case 'success':
      toast.success(title, options);
      break;
    case 'error':
      toast.error(title, options);
      break;
    case 'warning':
      toast.warning(title, options);
      break;
    default:
      toast.info(title, options);
  }
}

export function useEmPusher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const channelRef = useRef<Channel | null>(null);

  const invalidateDashboard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['requests', 'em-queue'] });
    void queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    void queryClient.invalidateQueries({ queryKey: ['guests', 'current'] });
    void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    void queryClient.invalidateQueries({ queryKey: ['bookings'] });
  }, [queryClient]);

  const handleNewRequest = useCallback(
    (data: {
      requestId: string;
      guestName: string;
      experienceName: string;
      preferredTime: string;
    }) => {
      invalidateDashboard();
      showDashboardToast(
        'info',
        'New experience request',
        `${data.guestName} — ${data.experienceName} · ${data.preferredTime}`,
      );
    },
    [invalidateDashboard],
  );

  const handleNewInquiry = useCallback(
    (data: {
      inquiryId: string;
      guestName: string;
      guestCount: number;
      purposeOfStay: string;
      preferredDates?: string;
    }) => {
      invalidateDashboard();
      toast.warning('New inquiry received', {
        description: `${data.guestName} · ${data.guestCount} guests · ${data.purposeOfStay}`,
        duration: 8000,
        action: {
          label: 'Review',
          onClick: () => router.push(`/inquiries/${data.inquiryId}`),
        },
      });
    },
    [invalidateDashboard, router],
  );

  const handleManifestSubmitted = useCallback(
    (data: { primaryGuestName: string; guestCount: number }) => {
      invalidateDashboard();
      showDashboardToast(
        'warning',
        'Manifest submitted — review required',
        `${data.primaryGuestName} — ${data.guestCount} guests added`,
      );
    },
    [invalidateDashboard],
  );

  const handleBookingArrived = useCallback(
    (data: { guestName: string; partySize: number }) => {
      invalidateDashboard();
      showDashboardToast(
        'success',
        'Guests arrived',
        `${data.guestName} · Party of ${data.partySize} has arrived`,
      );
    },
    [invalidateDashboard],
  );

  const handleRequestResolved = useCallback(() => {
    invalidateDashboard();
  }, [invalidateDashboard]);

  const handleBreezeWayOverdue = useCallback(
    (data: {
      experienceName: string;
      guestName: string;
      minutesOverdue: number;
    }) => {
      invalidateDashboard();
      showDashboardToast(
        'error',
        'Setup overdue',
        `${data.experienceName} for ${data.guestName} is ${data.minutesOverdue} min overdue`,
      );
    },
    [invalidateDashboard],
  );

  useEffect(() => {
    let mounted = true;

    void getDashboardPusherClient()
      .then((pusher) => {
        if (!mounted) return;

        const channel = pusher.subscribe('private-em-dashboard');
        channelRef.current = channel;

        channel.bind('new_request', handleNewRequest);
        channel.bind('new_inquiry', handleNewInquiry);
        channel.bind('manifest.submitted', handleManifestSubmitted);
        channel.bind('booking.arrived', handleBookingArrived);
        channel.bind('request.resolved', handleRequestResolved);
        channel.bind('breezeway.task_overdue', handleBreezeWayOverdue);
      })
      .catch((error: unknown) => {
        console.error('Failed to connect EM Pusher client:', error);
      });

    return () => {
      mounted = false;
      channelRef.current?.unbind_all();
      channelRef.current = null;
    };
  }, [
    handleNewRequest,
    handleNewInquiry,
    handleManifestSubmitted,
    handleBookingArrived,
    handleRequestResolved,
    handleBreezeWayOverdue,
  ]);

  useEffect(() => {
    return () => {
      disconnectDashboardPusher();
    };
  }, []);
}
