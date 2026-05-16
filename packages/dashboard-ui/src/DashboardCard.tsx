import type { ReactNode } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { getDashboardTokens, type DashboardVariant } from './dashboard-tokens';

export const DashboardCard = ({
  children,
  className,
  padding = true,
  variant = 'intel',
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  variant?: DashboardVariant;
}) => {
  const t = getDashboardTokens(variant);
  return (
    <div
      className={cn(
        'rounded-lg border',
        t.card,
        t.border,
        t.cardShadow,
        padding && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  );
};
