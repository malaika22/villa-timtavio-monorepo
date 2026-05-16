import { cn } from '@repo/ui/lib/utils';

import type { GuestStayActivityStatus } from '@/types';

const styles: Record<GuestStayActivityStatus, { pill: string; dot: string }> = {
  Completed: { pill: 'bg-manager-success-bg text-[#1e7e34]', dot: 'bg-[#1e7e34]' },
  Pending: { pill: 'bg-manager-warning-bg text-[#b45309]', dot: 'bg-[#b45309]' },
  Conflict: { pill: 'bg-manager-danger-bg text-[#c53030]', dot: 'bg-[#c53030]' },
};

export const GuestStayActivityStatusPill = ({ status }: { status: GuestStayActivityStatus }) => {
  const s = styles[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        s.pill,
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', s.dot)} />
      {status}
    </span>
  );
};
