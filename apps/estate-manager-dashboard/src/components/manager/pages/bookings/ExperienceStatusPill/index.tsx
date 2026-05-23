import { cn } from '@repo/ui/lib/utils';

import type { ExperienceRequestStatus } from '@/types';

const styles: Record<ExperienceRequestStatus, { pill: string; dot: string }> = {
  Pending: { pill: 'bg-[#fff4e5] text-[#b45309]', dot: 'bg-[#b45309]' },
  Complimentary: { pill: 'bg-[#e1effe] text-[#1e429f]', dot: 'bg-[#1e429f]' },
  Confirmed: { pill: 'bg-manager-success-bg text-[#1e7e34]', dot: 'bg-[#1e7e34]' },
};

export const ExperienceStatusPill = ({ status }: { status: ExperienceRequestStatus }) => {
  const s = styles[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        s.pill,
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', s.dot)} />
      {status}
    </span>
  );
};
