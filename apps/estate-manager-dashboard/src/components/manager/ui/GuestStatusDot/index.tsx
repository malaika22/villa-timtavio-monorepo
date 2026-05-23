import { cn } from '@repo/ui/lib/utils';

import type { GuestStayStatus } from '@/types';

const styles: Record<GuestStayStatus, string> = {
  Settled: 'bg-manager-success-bg text-[#1e7e34]',
  Departing: 'bg-manager-info-bg text-[#1e429f]',
  Arriving: 'bg-manager-warning-bg text-[#b45309]',
};

const dotStyles: Record<GuestStayStatus, string> = {
  Settled: 'bg-[#1e7e34]',
  Departing: 'bg-[#1e429f]',
  Arriving: 'bg-[#b45309]',
};

export const GuestStatusDot = ({ status }: { status: GuestStayStatus }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
      styles[status],
    )}
  >
    <span className={cn('size-2 shrink-0 rounded-full', dotStyles[status])} />
    {status}
  </span>
);
