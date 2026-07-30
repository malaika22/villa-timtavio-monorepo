import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@repo/api-client';
import { requestsApi } from '@/lib/api/requests';
import { enqueueRequest } from '@/lib/offline-queue';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from './useAuth';
import type {
  CreateExperienceRequestDto,
  ExperienceRequest,
} from '@repo/api-types';

/** Result of a create when the network was unavailable and it was queued. */
export type QueuedResult = { queued: true };

export function isQueuedResult(
  r: ExperienceRequest | QueuedResult,
): r is QueuedResult {
  return (r as QueuedResult).queued === true;
}

// A rejected fetch (offline / server unreachable) is NOT an ApiError — ApiError
// only wraps real HTTP responses. That's our signal to queue rather than fail.
function isNetworkError(err: unknown): boolean {
  return !(err instanceof ApiError);
}

/**
 * The booking store is the authoritative bookingId (populated by
 * useCurrentBooking); the JWT claim is often empty, so prefer the store.
 */
function useBookingId(): string | null {
  const storeBookingId = useBookingStore((s) => s.bookingId);
  const { bookingId: authBookingId } = useAuth();
  return storeBookingId ?? authBookingId;
}

export function useBookingRequests() {
  const bookingId = useBookingId();
  return useQuery({
    queryKey: ['requests', bookingId],
    queryFn: () => requestsApi.byBooking(bookingId!),
    enabled: !!bookingId,
  });
}

export function useRequestById(id: string | null) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsApi.byId(id!),
    enabled: !!id,
  });
}

export function usePendingApprovalRequests() {
  const bookingId = useBookingId();
  // Only the primary member can act on pending approvals — gate the query so a
  // secondary guest's client doesn't fire (and 403) against this endpoint.
  const { isPrimary } = useAuth();
  return useQuery({
    queryKey: ['requests', bookingId, 'pending-approval'],
    queryFn: () => requestsApi.pendingApproval(bookingId!),
    enabled: !!bookingId && isPrimary,
  });
}

export function useCreateRequest() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      dto: CreateExperienceRequestDto,
    ): Promise<ExperienceRequest | QueuedResult> => {
      if (!bookingId) {
        throw new Error('No active booking found. Please reopen the app.');
      }

      const queue = async (): Promise<QueuedResult> => {
        await enqueueRequest({
          id: crypto.randomUUID(),
          bookingId,
          dto,
          queuedAt: Date.now(),
        });
        return { queued: true };
      };

      // Known-offline: queue immediately without a doomed network round-trip.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return queue();
      }

      try {
        return await requestsApi.create(bookingId, dto);
      } catch (err) {
        // Lost connectivity mid-flight → queue and let the reconnect sync
        // replay it. Genuine API errors (validation, conflict) still surface.
        if (isNetworkError(err)) {
          return queue();
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', bookingId] });
    },
  });
}

function useInvalidateApprovals() {
  const bookingId = useBookingId();
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ['requests', bookingId, 'pending-approval'],
    });
    void queryClient.invalidateQueries({
      queryKey: ['requests', bookingId, 'pending-quote-approval'],
    });
    void queryClient.invalidateQueries({ queryKey: ['requests', bookingId] });
    // Approving a quote posts the charge, so the folio total moves too.
    void queryClient.invalidateQueries({ queryKey: ['folio', bookingId] });
  };
}

export function usePrimaryApprove() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: (id: string) => requestsApi.primaryApprove(id),
    onSuccess: invalidate,
  });
}

/**
 * Revised quotes awaiting a second primary approval — the concierge's final
 * figure landed materially above the estimate the primary originally approved.
 */
export function usePendingQuoteApprovals() {
  const bookingId = useBookingId();
  const { isPrimary } = useAuth();
  return useQuery({
    queryKey: ['requests', bookingId, 'pending-quote-approval'],
    queryFn: () => requestsApi.pendingQuoteApproval(bookingId!),
    enabled: !!bookingId && isPrimary,
  });
}

export function useApproveQuote() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: (id: string) => requestsApi.approveQuote(id),
    onSuccess: invalidate,
  });
}

export function useDeclineQuote() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      requestsApi.declineQuote(id, reason),
    onSuccess: invalidate,
  });
}

export function usePrimaryDecline() {
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      requestsApi.primaryDecline(id, reason),
    onSuccess: invalidate,
  });
}
