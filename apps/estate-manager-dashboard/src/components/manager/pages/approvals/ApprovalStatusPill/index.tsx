import { cn } from '@repo/ui/lib/utils';

import type { ApprovalQueueStatus } from '@/types';

const styles: Record<ApprovalQueueStatus, { pill: string; dot: string }> = {
  Conflict: {
    pill: 'bg-manager-danger-bg text-[#c53030]',
    dot: 'bg-[#c53030]',
  },
  Pending: {
    pill: 'bg-manager-warning-bg text-[#b45309]',
    dot: 'bg-[#b45309]',
  },
  Confirmed: {
    pill: 'bg-manager-success-bg text-[#1e7e34]',
    dot: 'bg-[#1e7e34]',
  },
  'In Progress': {
    pill: 'bg-manager-info-bg text-[#1e429f]',
    dot: 'bg-[#1e429f]',
  },
  Completed: {
    pill: 'bg-[#f0eeeb] text-manager-text-muted',
    dot: 'bg-manager-text-muted',
  },
  Declined: {
    pill: 'bg-[#f0eeeb] text-manager-text-muted',
    dot: 'bg-manager-text-muted',
  },
};

export const ApprovalStatusPill = ({
  status,
}: {
  status: ApprovalQueueStatus;
}) => {
  const s = styles[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap',
        s.pill,
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', s.dot)} />
      {status}
    </span>
  );
};
