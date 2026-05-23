import { cn } from '@repo/ui/lib/utils';

export const IntelLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      'text-[10px] font-medium tracking-[0.14em] text-intel-text-muted uppercase',
      className,
    )}
  >
    {children}
  </span>
);
