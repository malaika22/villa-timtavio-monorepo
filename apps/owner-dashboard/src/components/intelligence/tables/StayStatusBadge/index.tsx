import { cn } from '@repo/ui/lib/utils';
import type { StayStatus } from '@/types';

const config: Record<
  StayStatus,
  { label: string; className: string; dot: string }
> = {
  'arriving-today': {
    label: 'Arriving today',
    className:
      'border border-intel-warning/30 bg-intel-warning-bg text-intel-warning',
    dot: 'bg-intel-warning',
  },
  confirmed: {
    label: 'Confirmed',
    className:
      'border border-intel-success/30 bg-intel-success-bg text-intel-success',
    dot: 'bg-intel-success',
  },
  'pending-review': {
    label: 'Pending review',
    className:
      'border border-intel-warning/30 bg-intel-warning-bg text-intel-warning',
    dot: 'bg-intel-warning',
  },
};

export const StayStatusBadge = ({ status }: { status: StayStatus }) => {
  const c = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap',
        c.className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  );
};
