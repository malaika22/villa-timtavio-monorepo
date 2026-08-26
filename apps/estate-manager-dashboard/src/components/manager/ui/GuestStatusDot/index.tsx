import { cn } from '@repo/ui/lib/utils';

import type { GuestStayStatus } from '@/types';

const styles: Record<GuestStayStatus, string> = {
  Settled: 'bg-manager-success-bg text-[#1e7e34]',
  'Checked in': 'bg-[#e6f6f4] text-[#0f766e]',
  Departing: 'bg-manager-info-bg text-[#1e429f]',
  Arriving: 'bg-manager-warning-bg text-[#b45309]',
  Departed: 'bg-[#eef0f2] text-[#64748b]',
};

const dotStyles: Record<GuestStayStatus, string> = {
  Settled: 'bg-[#1e7e34]',
  'Checked in': 'bg-[#0f766e]',
  Departing: 'bg-[#1e429f]',
  Arriving: 'bg-[#b45309]',
  Departed: 'bg-[#64748b]',
};

export const GuestStatusDot = ({
  status,
  compact,
}: {
  status: GuestStayStatus;
  /** For dense lists. The dashboard table keeps the roomier default. */
  compact?: boolean;
}) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center rounded-full font-medium',
      compact ? 'gap-1 px-1.5 py-0.5 text-[10px]' : 'gap-1.5 px-3 py-1 text-sm',
      styles[status],
    )}
  >
    <span
      className={cn(
        'shrink-0 rounded-full',
        compact ? 'size-1.5' : 'size-2',
        dotStyles[status],
      )}
    />
    {status}
  </span>
);
