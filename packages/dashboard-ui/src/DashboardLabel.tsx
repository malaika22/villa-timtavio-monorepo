import type { ReactNode } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { getDashboardTokens, type DashboardVariant } from './dashboard-tokens';

export const DashboardLabel = ({
  children,
  className,
  variant = 'intel',
}: {
  children: ReactNode;
  className?: string;
  variant?: DashboardVariant;
}) => {
  const t = getDashboardTokens(variant);
  return (
    <p
      className={cn(
        'text-[10px] font-medium tracking-[0.14em] uppercase',
        t.textMuted,
        className,
      )}
    >
      {children}
    </p>
  );
};
