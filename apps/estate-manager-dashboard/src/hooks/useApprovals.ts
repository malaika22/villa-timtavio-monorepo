import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emRequestsApi } from '@/lib/api/requests';
import type {
  ConfirmRequestDto,
  ConfirmCostDto,
  DeclineRequestDto,
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
