import { GuestStatusDot } from '@/components/manager/ui/GuestStatusDot';
import type { GuestListStatus, GuestStayStatus } from '@/types';

const isStayStatus = (s: GuestListStatus): s is GuestStayStatus =>
  s === 'Settled' || s === 'Departing' || s === 'Arriving';

export const GuestListStatusBadge = ({
  status,
}: {
  status: GuestListStatus;
}) => {
  if (isStayStatus(status)) {
    return <GuestStatusDot status={status} />;
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f0eeeb] px-3 py-1 text-sm font-medium text-manager-text-muted">
      <span className="size-2 shrink-0 rounded-full bg-manager-text-muted" />
      Departed
    </span>
  );
};
