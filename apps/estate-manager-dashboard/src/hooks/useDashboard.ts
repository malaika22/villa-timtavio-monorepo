import { useApprovalQueue } from './useApprovals';
import { useCurrentGuests } from './useGuests';

export function useDashboard() {
  const guestsQuery = useCurrentGuests();
  const queueQuery = useApprovalQueue();

  return {
    guests: guestsQuery.data ?? [],
    guestsLoading: guestsQuery.isLoading,
    pendingApprovals: queueQuery.data ?? [],
    approvalsLoading: queueQuery.isLoading,
    isLoading: guestsQuery.isLoading || queueQuery.isLoading,
    error: guestsQuery.error ?? queueQuery.error,
  };
}
