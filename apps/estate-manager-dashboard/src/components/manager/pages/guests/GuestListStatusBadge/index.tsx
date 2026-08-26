import { cn } from '@repo/ui/lib/utils';

import { GuestStatusDot } from '@/components/manager/ui/GuestStatusDot';
import type { GuestListStatus, GuestStayStatus } from '@/types';

const isStayStatus = (s: GuestListStatus): s is GuestStayStatus =>
  s === 'Settled' || s === 'Departing' || s === 'Arriving';

export const GuestListStatusBadge = ({
  status,
  compact,
}: {
  status: GuestListStatus;
  compact?: boolean;
}) => {
  if (isStayStatus(status)) {
    return <GuestStatusDot status={status} compact={compact} />;
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-[#f0eeeb] font-medium text-manager-text-muted',
        compact
          ? 'gap-1 px-1.5 py-0.5 text-[10px]'
          : 'gap-1.5 px-3 py-1 text-sm',
      )}
    >
      <span
        className={cn(
          'shrink-0 rounded-full bg-manager-text-muted',
          compact ? 'size-1.5' : 'size-2',
        )}
      />
      Departed
    </span>
  );
};
