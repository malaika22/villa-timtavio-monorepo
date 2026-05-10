import { cn } from '@repo/ui/lib/utils';
import { ExperienceStatusChipConfig } from './constants';
import { ExperienceStatus } from '@/types/experienceStatus';

export const ExperienceStatusChip = ({
  experienceStatus,
  className,
}: {
  experienceStatus: ExperienceStatus;
  className?: string;
}) => {
  const meta = ExperienceStatusChipConfig[experienceStatus];

  if (!meta) return null;

  return (
    <div
      className={cn(
        'mt-0.5 shrink-0 whitespace-nowrap rounded-full border px-2 py-1 text-[8px] font-medium uppercase tracking-[1.12px]',
        meta.chip,
        className,
      )}
      role="status"
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn('inline-block size-[5px] rounded-full', meta.dot)}
          aria-hidden
        />
        {meta.label}
      </span>
    </div>
  );
};
