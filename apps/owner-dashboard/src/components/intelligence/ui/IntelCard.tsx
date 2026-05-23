import { cn } from '@repo/ui/lib/utils';

export const IntelCard = ({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) => (
  <div
    className={cn(
      'rounded-lg border border-intel-border bg-intel-card shadow-[0_1px_2px_rgba(26,22,20,0.04)]',
      padding && 'p-5',
      className,
    )}
  >
    {children}
  </div>
);
