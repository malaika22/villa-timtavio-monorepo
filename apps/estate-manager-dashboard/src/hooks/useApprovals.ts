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
