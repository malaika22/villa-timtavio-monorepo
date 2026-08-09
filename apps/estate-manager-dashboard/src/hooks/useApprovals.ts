import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emRequestsApi } from '@/lib/api/requests';
import { toast } from 'sonner';
import type {
  ConfirmRequestDto,
  ConfirmCostDto,
  DeclineRequestDto,
  RecordVendorCancellationDto,
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

/** The cancellation message, fetched when the estate opens the sheet. */
export function useVendorCancelMessage(id: string | null) {
  return useQuery({
    queryKey: ['vendor-cancel-message', id],
    queryFn: () => emRequestsApi.vendorCancelMessage(id!),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useMarkVendorCancelSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emRequestsApi.vendorCancelSent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['requests'] });
      toast.success('Marked as told');
    },
    onError: (e) => toast.error((e as Error).message),
  });
}

/**
 * What the vendor said about a fee.
 *
 * Recorded before the cancellation is confirmed, so the number on the guest's
 * folio has a source rather than being one the estate guessed at.
 */
export function useRecordVendorCancelReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: RecordVendorCancellationDto;
    }) => emRequestsApi.vendorCancelReply(id, dto),
    onSuccess: (_r, vars) => {
      void qc.invalidateQueries({ queryKey: ['requests'] });
      toast.success(
        vars.dto.fee
          ? "Recorded — confirm below and it goes on the guest's folio"
          : 'Recorded — no fee',
      );
    },
    onError: (e) => toast.error((e as Error).message),
  });
}
