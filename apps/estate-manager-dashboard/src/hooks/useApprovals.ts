import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emRequestsApi } from '@/lib/api/requests';
import { toast } from 'sonner';
import type {
  ConfirmRequestDto,
  ConfirmCostDto,
  DeclineRequestDto,
  RecordVendorReplyDto,
} from '@repo/api-types';

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['requests', 'em-queue'],
    queryFn: emRequestsApi.queue,
    refetchInterval: 30_000,
  });
}

export function useApprovalActive() {
  return useQuery({
    queryKey: ['requests', 'em-active'],
    queryFn: emRequestsApi.active,
    refetchInterval: 30_000,
  });
}

export function useApprovalHistory() {
  return useQuery({
    queryKey: ['requests', 'em-history'],
    queryFn: emRequestsApi.history,
    refetchInterval: 60_000,
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ConfirmRequestDto }) =>
      emRequestsApi.approve(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useDeclineRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: DeclineRequestDto }) =>
      emRequestsApi.decline(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

/** Experiences happening soon that still have no agreed price. */
export function useNeedsPricing() {
  return useQuery({
    queryKey: ['requests', 'needs-pricing'],
    queryFn: emRequestsApi.needsPricing,
    refetchInterval: 60_000,
  });
}

/** Experiences a guest has asked the estate to unwind. */
export function useCancellationRequests() {
  return useQuery({
    queryKey: ['requests', 'cancellation-requests'],
    queryFn: emRequestsApi.cancellationRequests,
    refetchInterval: 60_000,
  });
}

export function useConfirmCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fee }: { id: string; fee?: number }) =>
      emRequestsApi.confirmCancellation(id, fee),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['folio'] });
    },
  });
}

export function useConfirmCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ConfirmCostDto }) =>
      emRequestsApi.confirmCost(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// QA test affordance — simulate Breezeway completion so the guest READY flow
// (status + setup photo + notification) can be verified without a field worker.
export function useMarkReadyTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emRequestsApi.markReadyTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// ─── Booking the vendor ──────────────────────────────────────────────────────

/**
 * The WhatsApp message, fetched only when the estate opens the sheet.
 *
 * Composed on the server so the estate says the same thing every time, and so
 * changing the wording doesn't need three apps redeployed.
 */
export function useVendorMessage(id: string | null) {
  return useQuery({
    queryKey: ['vendor-message', id],
    queryFn: () => emRequestsApi.vendorMessage(id!),
    enabled: !!id,
    staleTime: 0,
  });
}

/** They've sent it. The guest is told we're arranging it. */
export function useMarkVendorAsked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emRequestsApi.vendorAsked(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['em-requests'] });
      void qc.invalidateQueries({ queryKey: ['approvals'] });
      toast.success('Marked as asked — the guest has been told');
    },
    onError: (e) => toast.error((e as Error).message),
  });
}

/**
 * What the vendor said.
 *
 * The one step that makes the rest honest: until this lands, nothing can tell
 * the difference between a vendor who agreed and a message nobody sent.
 */
export function useRecordVendorReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RecordVendorReplyDto }) =>
      emRequestsApi.vendorReply(id, dto),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: ['em-requests'] });
      void qc.invalidateQueries({ queryKey: ['approvals'] });
      toast.success(
        vars.dto.outcome === 'CONFIRMED'
          ? 'Vendor confirmed — you can price it now'
          : vars.dto.outcome === 'ALTERNATIVE'
            ? 'The guest has been asked about the new time'
            : 'Recorded — the guest has been told',
      );
    },
    onError: (e) => toast.error((e as Error).message),
  });
}
