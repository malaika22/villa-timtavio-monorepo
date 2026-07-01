'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@repo/api-client';

import { requestsApi } from '@/lib/api/requests';
import {
  getQueuedRequests,
  removeQueuedRequest,
} from '@/lib/offline-queue';

/**
 * Drains the offline experience-request queue whenever connectivity returns
 * (and once on mount, in case the app reopened already online with a backlog).
 * Mounted once, near the app root, inside the React Query provider.
 */
export function useOfflineRequestSync() {
  const queryClient = useQueryClient();
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    flushing.current = true;
    try {
      const queued = await getQueuedRequests();
      let submitted = 0;
      for (const item of queued) {
        try {
          await requestsApi.create(item.bookingId, item.dto);
          await removeQueuedRequest(item.id);
          submitted += 1;
        } catch (err) {
          if (err instanceof ApiError) {
            // The server rejected it (e.g. duplicate/validation) — it will never
            // succeed on retry, so drop it rather than blocking the queue.
            await removeQueuedRequest(item.id);
          } else {
            // Still offline / unreachable — stop and retry on the next event.
            break;
          }
        }
      }
      if (submitted > 0) {
        void queryClient.invalidateQueries({ queryKey: ['requests'] });
      }
    } finally {
      flushing.current = false;
    }
  }, [queryClient]);

  useEffect(() => {
    const run = () => {
      void flush().catch(() => {
        /* transient DB/network error — retried on the next online event */
      });
    };
    run();
    if (typeof window === 'undefined') return;
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, [flush]);
}
