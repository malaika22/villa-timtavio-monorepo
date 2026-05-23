import { cn } from '@repo/ui/lib/utils';

import { getDashboardTokens, type DashboardVariant } from './dashboard-tokens';
import type { StatusPillVariant } from './types';

const pillStyles = (
  variant: DashboardVariant,
  status: StatusPillVariant,
): { bg: string; text: string; dot: string } => {
  const t = getDashboardTokens(variant);
  switch (status) {
    case 'success':
      return { bg: t.successBg, text: t.success, dot: 'bg-current' };
    case 'warning':
      return { bg: t.warningBg, text: t.warning, dot: 'bg-current' };
    case 'danger':
      return { bg: t.dangerBg, text: t.danger, dot: 'bg-current' };
    case 'info':
      return { bg: t.infoBg, text: t.info, dot: 'bg-current' };
    default:
      return { bg: 'bg-[#f0eeeb]', text: t.textMuted, dot: 'bg-current' };
  }
};

export const StatusPill = ({
  label,
  status = 'success',
  variant = 'intel',
}: {
  label: string;
  status?: StatusPillVariant;
  variant?: DashboardVariant;
}) => {
  const styles = pillStyles(variant, status);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        styles.bg,
        styles.text,
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', styles.dot)} />
      {label}
    </span>
  );
};
