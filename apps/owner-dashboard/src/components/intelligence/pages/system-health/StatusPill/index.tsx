import { cn } from '@repo/ui/lib/utils';

export const StatusPill = ({
  label,
  variant = 'success',
}: {
  label: string;
  variant?: 'success' | 'warning' | 'neutral';
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
      variant === 'success' && 'bg-intel-success-bg text-intel-success',
      variant === 'warning' && 'bg-intel-warning-bg text-intel-warning',
      variant === 'neutral' && 'bg-[#f0eeeb] text-intel-text-muted',
    )}
  >
    <span
      className={cn(
        'size-1.5 rounded-full',
        variant === 'success' && 'bg-intel-success',
        variant === 'warning' && 'bg-intel-warning',
        variant === 'neutral' && 'bg-intel-text-muted',
      )}
    />
    {label}
  </span>
);
