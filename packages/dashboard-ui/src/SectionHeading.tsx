import { cn } from '@repo/ui/lib/utils';

import { getDashboardTokens, type DashboardVariant } from './dashboard-tokens';

export const SectionHeading = ({
  title,
  className,
  align = 'left',
  variant = 'intel',
}: {
  title: string;
  className?: string;
  align?: 'left' | 'center';
  variant?: DashboardVariant;
}) => {
  const t = getDashboardTokens(variant);
  return (
    <h2
      className={cn(
        t.sectionTitle,
        align === 'center' && 'text-center',
        className,
      )}
    >
      {title}
    </h2>
  );
};
